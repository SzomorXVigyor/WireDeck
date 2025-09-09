const { WireguardServer: WireguardServerStorage, RemoteVNC: WebVNCStorage } = require("./storageManager");
const certificateManager = require("./certificateManager");
const webProxyManager = require("./webProxyManager");
const WireguardContainer = require("./containers/wireguardServer");
const WebVNCContainer = require("./containers/webVNC");
const utils = require("./utils");

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

async function initServices() {
	// Load existing instances from storage
	const instances = await WireguardServerStorage.getAll();
	console.log(instances)
	for (const [name, instanceData] of Object.entries(instances)) {
		const wgContainer = new WireguardContainer(name, instanceData);
		WireguardServerService.wireguardServerInstances.set(name, wgContainer);

		// Load RemoteVNC instances if they exist
		if (instanceData.remoteVNC) {
			const webVNC = new WebVNCContainer(name, instanceData.remoteVNC);
			WebVNCService.vncServices.set(name, webVNC);
		}

		console.log(`✅ Loaded existing instance: ${name}`);
	}
};

WireguardServerService = {

	wireguardServerInstances: new Map(),

	async createInstance(rawName, options = {}) {
		let instanceData = null;
		let containerCreated = false;
		let proxyConfigured = false;

		const name = utils.sanitizeServiceName(rawName);

		try {

			if (this.wireguardServerInstances.has(name)) {
				throw new Error(`Instance already exists: ${name}`);
			}

			console.log(`🔧 Creating instance: ${name}`);

			// Step 1: Allocate instance in storage
			instanceData = await WireguardServerStorage.allocate(name, options);
			console.log(`📋 Instance allocated: ${name}`);

			// Step 2: Create subdomain certificate
			const subdomain = name;
			await certificateManager.createCertificate(subdomain);
			console.log(`🔒 Certificate created for: ${subdomain}`);

			// Step 3: Create and start container
			const wgContainer = new WireguardContainer(name, instanceData);
			this.wireguardServerInstances.set(name, wgContainer);
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
					await this.wireguardServerInstances.get(name).delete();
					this.wireguardServerInstances.delete(name);
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

	async deleteInstance(rawName) {

		const name = utils.sanitizeServiceName(rawName);

		try {
			console.log(`🗑️ Deleting instance: ${name}`);

			// Step 1: Stop and remove container
			await this.wireguardServerInstances.get(name).delete();
			this.wireguardServerInstances.delete(name);

			// Step 2: Remove nginx site
			await webProxyManager.removeSite(name);

			// Step 3: Free instance from storage
			WireguardServerStorage.free(name);

			console.log(`✅ Instance deleted: ${name}`);
		} catch (error) {
			console.error(`❌ Instance deletion failed for ${name}:`, error.message);
			throw error;
		}
	},

	async startInstance(rawName) {
		
		const name = utils.sanitizeServiceName(rawName);

		if (!this.wireguardServerInstances.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return this.wireguardServerInstances.get(name).start();
	},

	async stopInstance(rawName) {
		
		const name = utils.sanitizeServiceName(rawName);

		console.log(this.wireguardServerInstances)

		if (!this.wireguardServerInstances.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return this.wireguardServerInstances.get(name).stop();
	},

	async restartInstance(rawName) {
		
		const name = utils.sanitizeServiceName(rawName);

		if (!this.wireguardServerInstances.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return this.wireguardServerInstances.get(name).restart();
	},

	async statusInstance(rawName) {
		
		const name = utils.sanitizeServiceName(rawName);

		if (!this.wireguardServerInstances.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return this.wireguardServerInstances.get(name).getStatus();
	},

	async listInstances() {
		return Array.from(this.wireguardServerInstances.keys());
	}
};

WebVNCService = {
	
	vncServices: new Map(),

	async createInstance(rawName, options = {}) {
		let instanceData = null;
		let containerCreated = false;
		let proxyConfigured = false;

		const name = utils.sanitizeServiceName(rawName);

		try {

			if (this.vncServices.has(name)) {
				throw new Error(`Instance already exists: ${name}`);
			}

			// Step 1: Allocate instance in storage
			instanceData = await WebVNCStorage.initialize(name, options.wireguardConfig, options.loginUsers, options.vncDevices);
			console.log(`📋 VNC Instance allocated: ${name}`)
			
			// Step 2: Create subdomain certificate
			const subdomain = `vnc.${name}`;
			await certificateManager.createCertificate(subdomain);
			console.log(`🔒 Certificate created for: ${subdomain}`);

			// Step 3: Create and start container
			const vncContainer = new WebVNCContainer(name, instanceData);
			this.vncServices.set(name, vncContainer);
			await vncContainer.createContainer();
			containerCreated = true;
			console.log(`🐳 Container created: ${name}`);

			// Step 4: Update nginx configuration
			await webProxyManager.addSite(subdomain, instanceData.ipv4, `${subdomain}.${ROOT_DOMAIN}`);
			proxyConfigured = true;
			console.log(`🌐 Nginx updated for: ${subdomain}`);
			
			console.log(`✅ VNC Instance creation completed: ${name}`);
			return {
				message: "VNC Instance created successfully",
				subdomain: subdomain,
			};
		
		} catch (error) {
			console.error(`❌ VNC Instance creation failed for ${name}:`, error.message);

			// Revert everything that was successfully created
			try {
				if (proxyConfigured) {
					await webProxyManager.removeSite(name);
					console.log(`🔄 Reverted nginx configuration for: ${name}`);
				}

				if (containerCreated) {
					await this.vncServices.get(name).delete();
					this.vncServices.delete(name);
					console.log(`🔄 Reverted container creation for: ${name}`);
				}

				if (instanceData) {
					WebVNCStorage.remove(name);
					console.log(`🔄 Reverted storage allocation for: ${name}`);
				}
			} catch (revertError) {
				console.error(`❌ Failed to revert changes for ${name}:`, revertError.message);
			}

			throw error;

		}
	},

	async recreateInstance(rawName) {
		// Recreate in this context means destroy the container and the counterHandler object and recreate it, but not touching storage or nginx
		const name = utils.sanitizeServiceName(rawName);

		try {
			if (!this.vncServices.has(name)) {
				throw new Error(`Instance not found: ${name}`);
			}

			// Step 1: Stop and remove existing container
			await this.vncServices.get(name).delete();
			this.vncServices.delete(name);

			// Step 2: Recreate container from storage data
			const instanceData = await WebVNCStorage.get(name);
			if (!instanceData) {
				throw new Error(`Instance data not found in storage: ${name}`);
			}

			const vncContainer = new WebVNCContainer(name, instanceData);
			this.vncServices.set(name, vncContainer);
			await vncContainer.createContainer();

			console.log(`✅ VNC Instance recreated: ${name}`);
		} catch (error) {
			console.error(`❌ VNC Instance recreation failed for ${name}:`, error.message);
			throw error;
		}
	},

	async deleteInstance(rawName) {
		const name = utils.sanitizeServiceName(rawName);

		try {
			if (!this.vncServices.has(name)) {
				throw new Error(`Instance not found: ${name}`);
			}
		
			// Step 1: Stop and remove container
			await this.vncServices.get(name).delete();
			this.vncServices.delete(name);

			// Step 2: Remove nginx site
			await webProxyManager.removeSite(`vnc.${name}`);
			
			// Step 3: Free instance from storage
			WebVNCStorage.remove(name);

			console.log(`✅ VNC Instance deleted: ${name}`);

		} catch (error) {
			console.error(`❌ VNC Instance deletion failed for ${name}:`, error.message);
			throw error;
		}
	},

	async startInstance(rawName) {
		
		const name = utils.sanitizeServiceName(rawName);

		if (!this.vncServices.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return this.vncServices.get(name).start();
	},

	async stopInstance(rawName) {
		
		const name = utils.sanitizeServiceName(rawName);

		if (!this.vncServices.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return this.vncServices.get(name).stop();
	},

	async restartInstance(rawName) {
		
		const name = utils.sanitizeServiceName(rawName);

		if (!this.vncServices.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return this.vncServices.get(name).restart();
	},

	async statusInstance(rawName) {
		
		const name = utils.sanitizeServiceName(rawName);

		if (!this.vncServices.has(name)) {
			throw new Error(`Instance not found: ${name}`);
		}
		return this.vncServices.get(name).getStatus();
	},
}

module.exports = {
	initServices,
	WireguardServerService,
	WebVNCService,
};
