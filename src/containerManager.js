const Docker = require("dockerode");
const utils = require("./utils");
const certificateManager = require("./certificateManager");
const webProxyManager = require("./webProxyManager");

const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const ROOT_DOMAIN = process.env.ROOT_DOMAIN;
const usedImage = "ghcr.io/wg-easy/wg-easy:15.1";

async function ensureImage(docker, imageName) {
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

async function createContainer(name, instanceData) {
	const sanitizedName = utils.sanitizeServiceName(name);
	const containerName = `wg-easy-${sanitizedName}`;

  const volumeName = await ensureVolume(docker, containerName);

	await ensureImage(docker, usedImage);

	try {
		const container = await docker.createContainer({
			Image: usedImage,
			name: containerName,
			NetworkingConfig: {
				EndpointsConfig: {
					wgnet: {
						IPAMConfig: {
							IPv4Address: instanceData.ipv4,
						},
					},
				},
			},
			ExposedPorts: {
				"51820/udp": {},
			},
			HostConfig: {
				PortBindings: {
					"51820/udp": [{ HostPort: instanceData.udpPort.toString() }],
				},
				Binds: [
          "/lib/modules:/lib/modules:ro",
          `${volumeName}:/etc/wireguard`
        ],
				CapAdd: ["NET_ADMIN", "SYS_MODULE"],
				RestartPolicy: { Name: "unless-stopped" },
			},
			Env: [
				"INIT_ENABLED=true",
				`INIT_USERNAME=${instanceData.username}`,
				`INIT_PASSWORD=${instanceData.password}`,
				`INIT_HOST=${ROOT_DOMAIN}`,
				"INIT_PORT=51820",
				"INIT_DNS=1.1.1.1,8.8.8.8",
				`INIT_IPV4_CIDR=${instanceData.ipv4Cidr}`,
				`INIT_IPV6_CIDR=${utils.ipv4ToIpv6Cidr(instanceData.ipv4Cidr)}`,
				"DISABLE_IPV6=true",
				"PORT=51821",
				"HOST=0.0.0.0",
				"INSECURE=false",
			],
		});

		await container.start();
		console.log(`✅ Container created and started: ${containerName}`);
		return container;
	} catch (error) {
		console.error(`❌ Container creation failed for ${containerName}:`, error.message);
		throw error;
	}
}

async function startContainer(name) {
	const sanitizedName = utils.sanitizeServiceName(name);
	const containerName = `wg-easy-${sanitizedName}`;

	try {
		const container = docker.getContainer(containerName);
		await container.start();
		console.log(`▶️ Container started: ${containerName}`);
	} catch (error) {
		console.error(`❌ Container start failed for ${containerName}:`, error.message);
		throw error;
	}
}

async function stopContainer(name) {
	const sanitizedName = utils.sanitizeServiceName(name);
	const containerName = `wg-easy-${sanitizedName}`;

	try {
		const container = docker.getContainer(containerName);
		await container.stop();
		console.log(`⏹️ Container stopped: ${containerName}`);
	} catch (error) {
		console.error(`❌ Container stop failed for ${containerName}:`, error.message);
		throw error;
	}
}

async function restartContainer(name) {
	const sanitizedName = utils.sanitizeServiceName(name);
	const containerName = `wg-easy-${sanitizedName}`;

	try {
		const container = docker.getContainer(containerName);
		await container.restart();
		console.log(`🔄 Container restarted: ${containerName}`);
	} catch (error) {
		console.error(`❌ Container restart failed for ${containerName}:`, error.message);
		throw error;
	}
}

async function deleteContainer(name) {
	const sanitizedName = utils.sanitizeServiceName(name);
	const containerName = `wg-easy-${sanitizedName}`;

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

async function createInstance(name, options = {}) {
	const storageManager = require("./storageManager");
	let instanceData = null;
	let certificateCreated = false;
	let containerCreated = false;
	let proxyConfigured = false;

	try {
		console.log(`🔧 Creating instance: ${name}`);

		// Step 1: Allocate instance in storage
		instanceData = storageManager.allocateInstance(name, options);
		console.log(`📋 Instance allocated: ${name}`);

		// Step 2: Create subdomain certificate
		const subdomain = `${name}.${ROOT_DOMAIN}`;
		await certificateManager.createCertificate(subdomain);
		certificateCreated = true;
		console.log(`🔒 Certificate created for: ${subdomain}`);

		// Step 3: Create and start container
		await createContainer(name, instanceData);
		containerCreated = true;
		console.log(`🐳 Container created: ${name}`);

		// Step 4: Update nginx configuration
		await webProxyManager.addSite(name, instanceData.ipv4);
		proxyConfigured = true;
		console.log(`🌐 Nginx updated for: ${subdomain}`);

		console.log(`✅ Instance creation completed: ${name}`);
		return {
			message: "Instance created successfully",
			subdomain: subdomain,
			instanceData: instanceData,
		};
	} catch (error) {
		console.error(`❌ Instance creation failed for ${name}:`, error.message);

		// Revert everything that was successfully created
		try {
			if (proxyConfigured) {
				await webProxyManager.removeSite(name);
				console.log(`🔄 Reverted nginx configuration for: ${name}`);
			}

			if (containerCreated) {
				await deleteContainer(name);
				console.log(`🔄 Reverted container creation for: ${name}`);
			}

			// Note: We don't automatically remove certificates as they can be reused

			if (instanceData) {
				storageManager.freeInstance(name);
				console.log(`🔄 Reverted storage allocation for: ${name}`);
			}
		} catch (revertError) {
			console.error(`❌ Failed to revert changes for ${name}:`, revertError.message);
		}

		throw error;
	}
}

async function deleteInstance(name) {
	const storageManager = require("./storageManager");

	try {
		console.log(`🗑️ Deleting instance: ${name}`);

		// Step 1: Stop and remove container
		await deleteContainer(name);

		// Step 2: Remove nginx site
		await webProxyManager.removeSite(name);

		// Step 3: Free instance from storage
		storageManager.freeInstance(name);

		console.log(`✅ Instance deleted: ${name}`);
	} catch (error) {
		console.error(`❌ Instance deletion failed for ${name}:`, error.message);
		throw error;
	}
}

module.exports = {
	createContainer,
	startContainer,
	stopContainer,
	restartContainer,
	deleteContainer,
	createInstance,
	deleteInstance,
};
