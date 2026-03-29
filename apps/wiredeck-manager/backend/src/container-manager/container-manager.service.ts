import { Injectable, Logger } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import { DockerStatusDto } from './dto/docker-status.dto';
import { DockerContainerDto } from './dto/docker-container.dto';
import { DOCKER_SOCKET } from '../utils/env';

function createDockerClient(socket: string): Dockerode {
  if (socket.startsWith('tcp://')) {
    const url = new URL(socket);
    return new Dockerode({
      protocol: 'http',
      host: url.hostname,
      port: parseInt(url.port, 10),
    });
  }
  return new Dockerode({ socketPath: socket });
}

@Injectable()
export class ContainerManagerService {
  private readonly logger = new Logger(ContainerManagerService.name);
  private readonly docker = createDockerClient(DOCKER_SOCKET);

  // Status

  async getDockerStatus(): Promise<DockerStatusDto> {
    try {
      const info = await this.docker.info();

      return {
        connected: true,
        version: info.ServerVersion,
        os: info.OperatingSystem,
        containers: info.Containers,
        containersRunning: info.ContainersRunning,
        images: info.Images,
      };
    } catch (error) {
      this.logger.error('Failed to connect to Docker daemon', error);

      return {
        connected: false,
        version: '',
        os: '',
        containers: 0,
        containersRunning: 0,
        images: 0,
      };
    }
  }

  // Container listing

  /** List all containers (running + stopped). */
  async listContainers(): Promise<DockerContainerDto[]> {
    try {
      const containers = await this.docker.listContainers({ all: true });
      return containers.map((c) => this.mapContainer(c));
    } catch (error) {
      this.logger.error('Failed to list containers', error);
      return [];
    }
  }

  /** List only running containers. */
  async listRunningContainers(): Promise<DockerContainerDto[]> {
    try {
      const containers = await this.docker.listContainers({ all: false });
      return containers.map((c) => this.mapContainer(c));
    } catch (error) {
      this.logger.error('Failed to list running containers', error);
      return [];
    }
  }

  /** Get a specific container status by name */
  async getContainerStatus(nameOrId: string): Promise<DockerContainerDto> {
    try {
      const container = this.docker.getContainer(nameOrId);
      const info = await container.inspect();
      return this.mapContainerInfo(info);
    } catch (error) {
      this.logger.error(`Failed to get container status for ${nameOrId}`, error);
      return null;
    }
  }

  // Images and Volumes

  /** Pull a docker image if not present locally. */
  async acquireImage(imageName: string): Promise<string> {
    try {
      const images = await this.docker.listImages();
      const imageExists = images.some((img) => img.RepoTags?.includes(imageName));
      if (!imageExists) {
        this.logger.log(`Pulling image ${imageName}`);
        await new Promise((resolve, reject) => {
          this.docker.pull(imageName, (err, stream) => {
            if (err) return reject(err);
            this.docker.modem.followProgress(stream, onFinished, onProgress);

            function onFinished(err, output) {
              if (err) reject(err);
              else resolve(output);
            }

            function onProgress(event) {
              this.logger.debug(`Pull progress for ${imageName}: ${JSON.stringify(event)}`);
            }
          });
        });
        return imageName;
      } else {
        this.logger.debug(`Image ${imageName} already exists`);
        return imageName;
      }
    } catch (error) {
      this.logger.error(`Failed to pull image ${imageName}`, error);
      throw error;
    }
  }

  /** Create a volume if not present. */
  async ensureVolume(volumeName: string): Promise<string> {
    try {
      const volumes = await this.docker.listVolumes();
      const volumeExists = volumes.Volumes.find((v) => v.Name === volumeName);
      if (volumeExists) {
        this.logger.log(`Volume ${volumeName} already exists`);
        return volumeName;
      }
      await this.docker.createVolume({ Name: volumeName });
      this.logger.log(`Created volume: ${volumeName}`);
      return volumeName;
    } catch (error) {
      this.logger.error(`Failed to create volume ${volumeName}`, error);
      throw error;
    }
  }

  // Container lifecycle

  /** Start a stopped container by name or id. */
  async startContainer(nameOrId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.start();
      this.logger.log(`Started container: ${nameOrId}`);
    } catch (error) {
      this.logger.error(`Failed to start container ${nameOrId}`, error);
      throw error;
    }
  }

  /** Stop a running container by name or id. */
  async stopContainer(nameOrId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.stop();
      this.logger.log(`Stopped container: ${nameOrId}`);
    } catch (error) {
      this.logger.error(`Failed to stop container ${nameOrId}`, error);
      throw error;
    }
  }

  /** Restart a container by name or id. */
  async restartContainer(nameOrId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.restart();
      this.logger.log(`Restarted container: ${nameOrId}`);
    } catch (error) {
      this.logger.error(`Failed to restart container ${nameOrId}`, error);
      throw error;
    }
  }

  /** Remove a container by name or id. */
  async removeContainer(nameOrId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.remove();
      this.logger.log(`Removed container: ${nameOrId}`);
    } catch (error) {
      this.logger.error(`Failed to remove container ${nameOrId}`, error);
      throw error;
    }
  }

  // Private helpers

  private mapContainer(c: Dockerode.ContainerInfo): DockerContainerDto {
    return {
      id: c.Id.slice(0, 12),
      name: (c.Names?.[0] ?? '').replace(/^\//, ''),
      image: c.Image,
      state: c.State,
      status: c.Status,
      ports: (c.Ports ?? []).map((p) => ({
        privatePort: p.PrivatePort,
        publicPort: p.PublicPort,
        type: p.Type,
      })),
    };
  }

  private mapContainerInfo(c: Dockerode.ContainerInspectInfo): DockerContainerDto {
    return {
      id: c.Id.slice(0, 12),
      name: (c.Name ?? '').replace(/^\//, ''),
      image: c.Config.Image,
      state: c.State.Status,
      status: c.State.Status,
    };
  }
}
