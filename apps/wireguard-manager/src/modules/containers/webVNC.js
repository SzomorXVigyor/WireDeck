const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const containerManager = require('./containerManager');
const utils = require('../utils');
const logger = require('../logger');

const usedImage = 'webvnc:latest';

class WebVNCContainer {
  constructor(name, options = {}) {
    this.name = utils.sanitizeServiceName(name);
    this.containerName = `web-vnc-${this.name}`;
    this.options = options;
  }

  async createContainer() {
    await containerManager.ensureImage(usedImage);

    try {
      const container = await docker.createContainer({
        Image: usedImage,
        name: this.containerName,
        NetworkingConfig: {
          EndpointsConfig: {
            wgnet: {
              IPAMConfig: {
                IPv4Address: this.options.ipv4,
              },
            },
          },
        },
        HostConfig: {
          Binds: ['/lib/modules:/lib/modules:ro'],
          CapAdd: ['NET_ADMIN', 'SYS_MODULE'],
          RestartPolicy: { Name: 'unless-stopped' },
          Sysctls: {
            'net.ipv6.conf.all.disable_ipv6': '1',
            'net.ipv6.conf.default.disable_ipv6': '1',
            'net.ipv6.conf.lo.disable_ipv6': '1',
          },
          Dns: ['1.1.1.1', '8.8.8.8'],
        },
        Env: [
          'WIREDECK_SLAVE=true',
          `PASS_CHANGE_URL=${process.env.ROOT_DOMAIN}/webvnc-passchangerequest.index.html`,
          `SERVICE_NAME=${this.name}`,
          `USERS=${JSON.stringify(this.options.loginUsers)}`,
          `VNC_TARGETS=${JSON.stringify(this.options.vncDevices)}`,
          `WIREGUARD_CONF_STR=${this.options.wireguard.config}`,
          `JWT_SECRET=${process.env.JWT_SECRET || utils.generateRandomString(16)}`,
          `FRONTEND_PORT=8080`,
          `FRONTEND_URL=vnc.${this.name}.${process.env.ROOT_DOMAIN}`,
        ],
      });

      await container.start();
      logger.info(`[WebVNC] Container created and started: ${this.containerName}`);
      return container;
    } catch (error) {
      logger.error(`[WebVNC] Container creation failed for ${this.containerName}: ${error.message}`);
      throw error;
    }
  }

  async start() {
    logger.debug(`[WebVNC] Starting container: ${this.containerName}`);
    return containerManager.startContainer(this.containerName);
  }

  async stop() {
    logger.debug(`[WebVNC] Stopping container: ${this.containerName}`);
    return containerManager.stopContainer(this.containerName);
  }

  async restart() {
    logger.debug(`[WebVNC] Restarting container: ${this.containerName}`);
    return containerManager.restartContainer(this.containerName);
  }

  async delete() {
    logger.debug(`[WebVNC] Deleting container: ${this.containerName}`);
    return containerManager.deleteContainer(this.containerName);
  }

  async getStatus() {
    logger.debug(`[WebVNC] Getting status for container: ${this.containerName}`);
    return containerManager.getContainerStatus(this.containerName);
  }
}

module.exports = WebVNCContainer;
