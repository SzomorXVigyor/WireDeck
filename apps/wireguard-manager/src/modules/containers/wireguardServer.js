const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const containerManager = require("./containerManager");
const utils = require("../utils");

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;
const usedImage = "ghcr.io/wg-easy/wg-easy:15.1";

class WireguardServerContainer {
	constructor(name, options = {}) {
		this.name = utils.sanitizeServiceName(name);
		this.containerName = `wg-easy-${this.name}`;
		this.options = options;
	}

	async createContainer() {
		const volumeName = await containerManager.ensureVolume(this.containerName);
		await containerManager.ensureImage(usedImage);
		const portWithSuffix = this.options.udpPort.toString() + "/udp";

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
				ExposedPorts: {
					[portWithSuffix]: {},
				},
				HostConfig: {
					PortBindings: {
						[portWithSuffix]: [{ HostPort: this.options.udpPort.toString() }],
					},
					Binds: ["/lib/modules:/lib/modules:ro", `${volumeName}:/etc/wireguard`],
					CapAdd: ["NET_ADMIN", "SYS_MODULE"],
					RestartPolicy: { Name: "unless-stopped" },
				},
				Env: [
					"INIT_ENABLED=true",
					`INIT_USERNAME=${this.options.username}`,
					`INIT_PASSWORD=${this.options.password}`,
					`INIT_HOST=${ROOT_DOMAIN}`,
					`INIT_PORT=${this.options.udpPort.toString()}`,
					"INIT_DNS=1.1.1.1,8.8.8.8",
					`INIT_IPV4_CIDR=${this.options.ipv4Cidr}`,
					`INIT_IPV6_CIDR=${utils.ipv4ToIpv6Cidr(this.options.ipv4Cidr)}`,
					"DISABLE_IPV6=true",
					"PORT=80",
					"HOST=0.0.0.0",
					"INSECURE=false",
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

module.exports = WireguardServerContainer;
