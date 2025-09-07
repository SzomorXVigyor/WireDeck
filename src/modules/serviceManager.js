const { WireguardServer: WireguardServerStorage } = require("./storageManager");
const certificateManager = require("./certificateManager");
const webProxyManager = require("./webProxyManager");
const WireguardContainer = require("./containers/wireguardServer");

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

const vncServices = new Map();

WireguardServerService = {

	wireguardServerInstances: new Map(),

	async init() {
		// Load existing instances from storage
		const state = WireguardServerStorage.getAll();
		for (const [name, instanceData] of Object.entries(state.instances)) {
			const wgContainer = new WireguardContainer(name, instanceData);
			this.wireguardServerInstances.set(name, wgContainer);
			console.log(`✅ Loaded existing instance: ${name}`);
		}
	},

	async createInstance(name, options = {}) {
		let instanceData = null;
		let containerCreated = false;
		let proxyConfigured = false;

		try {
			console.log(`🔧 Creating instance: ${name}`);

			// Step 1: Allocate instance in storage
			instanceData = WireguardServerStorage.allocate(name, options);
			console.log(`📋 Instance allocated: ${name}`);

			// Step 2: Create subdomain certificate
			const subdomain = `${name}.${ROOT_DOMAIN}`;
			await certificateManager.createCertificate(subdomain);
			console.log(`🔒 Certificate created for: ${subdomain}`);

			// Step 3: Create and start container
			const wgContainer = new WireguardContainer(name, instanceData);
			wireguardServerInstances.set(name, wgContainer);
			await wgContainer.createContainer();
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
					await wireguardServerInstances.get(name).delete();
					wireguardServerInstances.delete(name);
					console.log(`🔄 Reverted container creation for: ${name}`);
				}

				if (instanceData) {
					WireguardServerStorage.free(name);
					console.log(`🔄 Reverted storage allocation for: ${name}`);
				}
			} catch (revertError) {
				console.error(`❌ Failed to revert changes for ${name}:`, revertError.message);
			}

			throw error;
		}
	},

	async deleteInstance(name) {
		try {
			console.log(`🗑️ Deleting instance: ${name}`);

			// Step 1: Stop and remove container
			await wireguardServerInstances.get(name).delete();
			wireguardServerInstances.delete(name);

			// Step 2: Remove nginx site
			await webProxyManager.removeSite(name);

			// Step 3: Free instance from storage
			storageManager.freeInstance(name);

			console.log(`✅ Instance deleted: ${name}`);
		} catch (error) {
			console.error(`❌ Instance deletion failed for ${name}:`, error.message);
			throw error;
		}
	},

	async startInstance(name) {
		if (!wireguardServerInstances.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return wireguardServerInstances.get(name).start();
	},

	async stopInstance(name) {
		if (!wireguardServerInstances.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return wireguardServerInstances.get(name).stop();
	},

	async restartInstance(name) {
		if (!wireguardServerInstances.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return wireguardServerInstances.get(name).restart();
	},

	async statusInstance(name) {
		if (!wireguardServerInstances.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return wireguardServerInstances.get(name).status();
	},

	async listInstances() {
		return Array.from(wireguardServerInstances.keys());
	}
}

module.exports = {
	WireguardServerService
};
