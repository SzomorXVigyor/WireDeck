const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const containerManager = require("./containerManager");
const utils = require("../utils");

const usedImage = "webvnc:latest";

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
					Binds: ["/lib/modules:/lib/modules:ro"],
					CapAdd: ["NET_ADMIN", "SYS_MODULE"],
					RestartPolicy: { Name: "unless-stopped" },
					Sysctls: {
						"net.ipv6.conf.all.disable_ipv6": "1",
						"net.ipv6.conf.default.disable_ipv6": "1",
						"net.ipv6.conf.lo.disable_ipv6": "1",
					},
					Dns: ["1.1.1.1", "8.8.8.8"],
				},
				Env: [
                    `USERS=${JSON.stringify(this.options.loginUsers)}`,
                    `VNC_TARGETS=${JSON.stringify(this.options.vncDevices)}`,
                    `WIREGUARD_CONF_STR=${this.options.wireguard.config}`,
                    `JWT_SECRET=${process.env.JWT_SECRET || utils.generateRandomString(16)}`,
                    `FRONTEND_PORT=8080`,
                    `FRONTEND_URL=vnc.${this.name}.${process.env.ROOT_DOMAIN}`,
                ],
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

	async getStatus() {
		return containerManager.getContainerStatus(this.containerName);
	}
}

module.exports = WebVNCContainer;
