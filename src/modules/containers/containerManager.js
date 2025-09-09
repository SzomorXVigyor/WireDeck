const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

async function dockerInfo() {
    try {
        const info = await docker.info();
        return info;
    } catch (error) {
        console.error("❌ Failed to retrieve Docker info:", error.message);
        throw error;
    }
}

async function ensureImage(imageName) {
	const images = await docker.listImages();
	const imageExists = images.some((img) => img.RepoTags && img.RepoTags.includes(imageName));

	if (!imageExists) {
		console.log(`Pulling image: ${imageName}`);
		await new Promise((resolve, reject) => {
			docker.pull(imageName, (err, stream) => {
				if (err) return reject(err);
				docker.modem.followProgress(stream, onFinished, onProgress);

				function onFinished(err, output) {
					if (err) reject(err);
					else resolve(output);
				}

				function onProgress(event) {}
			});
		});
	}
}

async function ensureVolume(containerName) {
	const volumeName = containerName;

	// Try to find existing volume
	const volumes = await docker.listVolumes();
	const existing = volumes.Volumes.find((v) => v.Name === volumeName);

	if (existing) {
		console.log(`Using existing volume: ${volumeName}`);
		return volumeName;
	}

	// Create volume if not found
	console.log(`Creating new volume: ${volumeName}`);
	const volume = await docker.createVolume({ Name: volumeName });
	return volume.name;
}

async function startContainer(containerName) {
	try {
		const container = docker.getContainer(containerName);
		await container.start();
		console.log(`▶️ Container started: ${containerName}`);
	} catch (error) {
		console.error(`❌ Container start failed for ${containerName}:`, error.message);
		throw error;
	}
}

async function stopContainer(containerName) {
	try {
		const container = docker.getContainer(containerName);
		await container.stop();
		console.log(`⏹️ Container stopped: ${containerName}`);
	} catch (error) {
		console.error(`❌ Container stop failed for ${containerName}:`, error.message);
		throw error;
	}
}

async function restartContainer(containerName) {
	try {
		const container = docker.getContainer(containerName);
		await container.restart();
		console.log(`🔄 Container restarted: ${containerName}`);
	} catch (error) {
		console.error(`❌ Container restart failed for ${containerName}:`, error.message);
		throw error;
	}
}

async function deleteContainer(containerName) {
	try {
		const container = docker.getContainer(containerName);

		// Try to stop the container first
		try {
			await container.stop();
			console.log(`🛑 Container stopped: ${containerName}`);
		} catch (stopError) {
			if (stopError.statusCode === 304) {
				console.log(`⚠️ Container was already stopped: ${containerName}`);
			} else if (stopError.statusCode === 404) {
				console.log(`⚠️ Container not found (already deleted): ${containerName}`);
				return; // Nothing to do
			} else {
				throw stopError;
			}
		}

		// Remove the container
		await container.remove();
		console.log(`🗑️ Container removed: ${containerName}`);
	} catch (error) {
		if (error.statusCode === 404 || /no such container/i.test(error.message)) {
			console.log(`⚠️ Container not found: ${containerName} — nothing to delete`);
			return;
		}
		console.error(`❌ Container deletion failed for ${containerName}:`, error.message);
		throw error;
	}
}

async function getContainerStatus(containerName) {
    try {
        const container = docker.getContainer(containerName);
        const data = await container.inspect();
        return data.State.Status; // e.g., "running", "exited", etc.
    } catch (error) {
        if (error.statusCode === 404 || /no such container/i.test(error.message)) {
            return "not found";
        }
        console.error(`❌ Failed to get status for ${containerName}:`, error.message);
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