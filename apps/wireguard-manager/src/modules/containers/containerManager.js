const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const logger = require("../logger");

async function dockerInfo() {
    try {
        const info = await docker.info();
        return info;
    } catch (error) {
        logger.error(`[Docker] Failed to retrieve info: ${error.message}`);
        throw error;
    }
}

async function ensureImage(imageName) {
    try {
        const images = await docker.listImages();
        const imageExists = images.some(
            (img) => img.RepoTags && img.RepoTags.includes(imageName)
        );

        if (!imageExists) {
            logger.info(`[Docker] Pulling image: ${imageName}`);
            await new Promise((resolve, reject) => {
                docker.pull(imageName, (err, stream) => {
                    if (err) return reject(err);
                    docker.modem.followProgress(stream, onFinished, onProgress);

                    function onFinished(err, output) {
                        if (err) reject(err);
                        else resolve(output);
                    }

                    function onProgress(event) {
                        logger.debug(`[Docker] Pull progress for ${imageName}: ${JSON.stringify(event)}`);
                    }
                });
            });
        } else {
            logger.debug(`[Docker] Image already exists: ${imageName}`);
        }
    } catch (error) {
        logger.error(`[Docker] Failed to ensure image=${imageName}: ${error.message}`);
        throw error;
    }
}

async function ensureVolume(containerName) {
    try {
        const volumeName = containerName;
        const volumes = await docker.listVolumes();
        const existing = volumes.Volumes.find((v) => v.Name === volumeName);

        if (existing) {
            logger.debug(`[Docker] Using existing volume: ${volumeName}`);
            return volumeName;
        }

        logger.info(`[Docker] Creating new volume: ${volumeName}`);
        const volume = await docker.createVolume({ Name: volumeName });
        return volume.name;
    } catch (error) {
        logger.error(`[Docker] Failed to ensure volume=${containerName}: ${error.message}`);
        throw error;
    }
}

async function startContainer(containerName) {
    try {
        const container = docker.getContainer(containerName);
        await container.start();
        logger.info(`[Docker] Container started: ${containerName}`);
    } catch (error) {
        logger.error(`[Docker] Start failed for container=${containerName}: ${error.message}`);
        throw error;
    }
}

async function stopContainer(containerName) {
    try {
        const container = docker.getContainer(containerName);
        await container.stop();
        logger.info(`[Docker] Container stopped: ${containerName}`);
    } catch (error) {
        logger.error(`[Docker] Stop failed for container=${containerName}: ${error.message}`);
        throw error;
    }
}

async function restartContainer(containerName) {
    try {
        const container = docker.getContainer(containerName);
        await container.restart();
        logger.info(`[Docker] Container restarted: ${containerName}`);
    } catch (error) {
        logger.error(`[Docker] Restart failed for container=${containerName}: ${error.message}`);
        throw error;
    }
}

async function deleteContainer(containerName) {
    try {
        const container = docker.getContainer(containerName);

        // Try stopping first
        try {
            await container.stop();
            logger.info(`[Docker] Container stopped before deletion: ${containerName}`);
        } catch (stopError) {
            if (stopError.statusCode === 304) {
                logger.debug(`[Docker] Container already stopped: ${containerName}`);
            } else if (stopError.statusCode === 404) {
                logger.warn(`[Docker] Container not found (already deleted): ${containerName}`);
                return;
            } else {
                throw stopError;
            }
        }

        await container.remove();
        logger.info(`[Docker] Container removed: ${containerName}`);
    } catch (error) {
        if (error.statusCode === 404 || /no such container/i.test(error.message)) {
            logger.warn(`[Docker] Container not found: ${containerName}, nothing to delete`);
            return;
        }
        logger.error(`[Docker] Deletion failed for container=${containerName}: ${error.message}`);
        throw error;
    }
}

async function getContainerStatus(containerName) {
    try {
        const container = docker.getContainer(containerName);
        const data = await container.inspect();
        const status = data.State.Status;
        logger.debug(`[Docker] Container status for ${containerName}: ${status}`);
        return status;
    } catch (error) {
        if (error.statusCode === 404 || /no such container/i.test(error.message)) {
            logger.warn(`[Docker] Container not found: ${containerName}`);
            return "not found";
        }
        logger.error(`[Docker] Failed to get status for container=${containerName}: ${error.message}`);
        throw error;
    }
}

module.exports = {
    startContainer,
    stopContainer,
    restartContainer,
    deleteContainer,
    getContainerStatus,
    ensureImage,
    ensureVolume,
    dockerInfo,
};
