const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const logger = require('../logger');

const usedImage = 'dbmigrator:latest';

class DBMigratorContainer {
  constructor(serviceIdentifier, serviceName) {
    this.serviceIdentifier = serviceIdentifier;
    this.serviceName = serviceName;
    this.containerName = `dbmigrator-${this.serviceIdentifier}-${Date.now()}`;
  }

  async #runMigratorContainer() {
    try {
      const container = await docker.createContainer({
        name: this.containerName,
        Image: usedImage,
        HostConfig: {
          AutoRemove: true,
          NetworkMode: 'wgnet',
        },
        Env: [`DATABASE_URL=${process.env.DATABASE_URL}`, `SERVICE_IDENTIFIER=${this.serviceIdentifier}`, `SERVICE_NAME=${this.serviceName}`],
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      // Pipe container logs
      stream.pipe(process.stdout);

      await container.start();

      const result = await container.wait();

      if (result.StatusCode !== 0) {
        throw new Error(`Container exited with status code: ${result.StatusCode}`);
      }

      logger.info(`[DBMigrator] Container finished successfully for serviceIdentifier=${this.serviceIdentifier}`);
    } catch (error) {
      logger.error(`[DBMigrator] Container run error: ${error.message}, serviceIdentifier=${this.serviceIdentifier}`);
      throw error;
    }
  }

  async migrate() {
    try {
      logger.info(`[DBMigrator] Starting database migration for serviceIdentifier=${this.serviceIdentifier}, serviceName=${this.serviceName}`);
      await this.#runMigratorContainer();
      logger.info(`[DBMigrator] Database migration completed successfully for serviceIdentifier=${this.serviceIdentifier}`);
    } catch (error) {
      logger.error(`[DBMigrator] Database migration error: ${error.message}, serviceIdentifier=${this.serviceIdentifier}`);
      throw error;
    }
  }
}

module.exports = DBMigratorContainer;
