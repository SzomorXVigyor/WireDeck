const storageManager = require("../modules/storageManager");
const serviceManager = require("../modules/serviceManager");

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

// Get all instances
async function getAllInstances(req, res) {
	try {
		const instances = await storageManager.WireguardServer.getAll();
		const instancesWithStatus = {};

		for (const [name, instance] of Object.entries(instances)) {
			const isRunning = await serviceManager.WireguardServerService.statusInstance(name) === "running";

			const { username, password, remoteVNC, ...safeInstance } = instance;

			instancesWithStatus[name] = {
				...safeInstance,
				status: isRunning ? "online" : "offline",
				subdomain: `${name}.${ROOT_DOMAIN}`,
			};

			if (remoteVNC) {
				const isVncRunning = await serviceManager.WebVNCService.statusInstance(name) === "running";

				remoteVNC.loginUsers.forEach(element => {
					delete element.password;
				});

				remoteVNC.vncDevices.forEach(element => {
					delete element.password;
				});

				const { wireguard, ...safeVncInstance } = remoteVNC;

				instancesWithStatus[name].remoteVNC = { 
					...safeVncInstance,
					status: isVncRunning ? "online" : "offline",
					subdomain: `vnc.${name}.${ROOT_DOMAIN}`
				}
			}
		}

		res.json(instancesWithStatus);
	} catch (error) {
		console.error("❌ Error reading instances:", error.message);
		res.status(500).json({ error: "Failed to read instances" });
	}
}

// Create new instance
async function createInstance(req, res) {
	const { name, username, password, ipv4Cidr } = req.body;

	if (!name || typeof name !== "string") {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		const options = {};
		if (username) options.username = username;
		if (password) options.password = password;
		if (ipv4Cidr) options.ipv4Cidr = ipv4Cidr;

		if (password && password > 0 && password.length < 12) {
			throw new Error("Password must be at least 12 characters long");
		}

		const result = await serviceManager.WireguardServerService.createInstance(name, options);
		res.json(result);
	} catch (error) {
		console.error(`❌ Create instance error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Start instance
async function startInstance(req, res) {
	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		await serviceManager.WireguardServerService.startInstance(name);
		if (await storageManager.RemoteVNC.exists(name)) {
			await serviceManager.WebVNCService.startInstance(name);
		}
		res.json({ message: "Instance started successfully" });
	} catch (error) {
		console.error(`❌ Start error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Stop instance
async function stopInstance(req, res) {
	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		await serviceManager.WireguardServerService.stopInstance(name);
		if (await storageManager.RemoteVNC.exists(name)) {
			await serviceManager.WebVNCService.stopInstance(name);
		}
		res.json({ message: "Instance stopped successfully" });
	} catch (error) {
		console.error(`❌ Stop error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Restart instance
async function restartInstance(req, res) {
	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		await serviceManager.WireguardServerService.restartInstance(name);
		if (await storageManager.RemoteVNC.exists(name)) {
			await serviceManager.WebVNCService.restartInstance(name);
		}
		res.json({ message: "Instance restarted successfully" });
	} catch (error) {
		console.error(`❌ Restart error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Delete instance
async function deleteInstance(req, res) {
	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		await serviceManager.WireguardServerService.deleteInstance(name);
		if (await storageManager.RemoteVNC.exists(name)) {
			await serviceManager.WebVNCService.deleteInstance(name);
		}
		res.json({ message: "Instance deleted successfully" });
	} catch (error) {
		console.error(`❌ Delete error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

module.exports = {
	getAllInstances,
	createInstance,
	startInstance,
	stopInstance,
	restartInstance,
	deleteInstance
};