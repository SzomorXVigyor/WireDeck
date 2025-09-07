const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const containerManager = require("../serviceManager");
const utils = require("../utils");

const usedImage = "webvnc:latest";

class WebVNCContainer {
	constructor(name, options = {}) {
		this.name = utils.sanitizeServiceName(name);
		this.containerName = `web-vnc-${this.name}`;
		this.options = options;
	}

	async createContainer() {
		await ensureImage(usedImage);

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
					Binds: ["/lib/modules:/lib/modules:ro"],
					CapAdd: ["NET_ADMIN", "SYS_MODULE"],
					RestartPolicy: { Name: "unless-stopped" },
				},
				Env: ["USERS=", "VNC_TARGETS=", "WIREGUARD_CONF_STR="],
			});

			await container.start();
			console.log(`✅ Container created and started: ${this.containerName}`);
			return container;
		} catch (error) {
			console.error(`❌ Container creation failed for ${this.containerName}:`, error.message);
			throw error;
		}
	}

	async start() {
		return containerManager.startContainer(this.containerName);
	}

	async stop() {
		return containerManager.stopContainer(this.containerName);
	}

	async restart() {
		return containerManager.restartContainer(this.containerName);
	}

	async delete() {
		return containerManager.deleteContainer(this.containerName);
	}
}

module.exports = WebVNCContainer;
