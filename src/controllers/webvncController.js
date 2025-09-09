const storageManager = require("../modules/storageManager");
const serviceManager = require("../modules/serviceManager");
const utils = require("../modules/utils");

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

// Get single WebVNC instance
async function getWebVNCInstance(req, res) {
	const { name } = req.params;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		const instance = await storageManager.WireguardServer.get(name);
		if (!instance) {
			return res.status(404).json({ error: "WireGuard instance not found" });
		}

		if (!instance.remoteVNC) {
			return res.status(404).json({ error: "WebVNC not configured for this instance" });
		}

		const isRunning = await serviceManager.WebVNCService.statusInstance(name) === "running";

		instance.remoteVNC.loginUsers.forEach(element => {
			delete element.password;
		});

		instance.remoteVNC.vncDevices.forEach(element => {
			delete element.password;
		});

		const { wireguard, ...safeVncInstance } = instance.remoteVNC;
		
		const webvncInstance = {
			...safeVncInstance,
			status: isRunning ? "online" : "offline",
			subdomain: `vnc.${name}.${ROOT_DOMAIN}`,
		};

		res.json(webvncInstance);
	} catch (error) {
		console.error("❌ Error reading WebVNC instance:", error.message);
		res.status(500).json({ error: "Failed to read WebVNC instance" });
	}
}

// Create new WebVNC instance
async function createWebVNCInstance(req, res) {
	const { name, wireguardConfig, loginUsers, vncDevices } = req.body;

	if (!name || typeof name !== "string") {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		// Check if WireGuard instance exists
		const wireguardInstance = await storageManager.WireguardServer.get(name);
		if (!wireguardInstance) {
			return res.status(404).json({ error: "WireGuard instance not found" });
		}

		// Check if WebVNC already exists for this instance
		if (wireguardInstance.remoteVNC) {
			return res.status(400).json({ error: "WebVNC already exists for this instance" });
		}

		const options = {
			wireguardConfig: wireguardConfig || "",
			loginUsers: loginUsers || [],
			vncDevices: vncDevices || []
		};

		const result = await serviceManager.WebVNCService.createInstance(name, options);
		res.json(result);
	} catch (error) {
		console.error(`❌ Create WebVNC instance error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Start WebVNC instance
async function startWebVNCInstance(req, res) {
	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		await serviceManager.WebVNCService.startInstance(name);
		res.json({ message: "WebVNC instance started successfully" });
	} catch (error) {
		console.error(`❌ Start WebVNC error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Stop WebVNC instance
async function stopWebVNCInstance(req, res) {
	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		await serviceManager.WebVNCService.stopInstance(name);
		res.json({ message: "WebVNC instance stopped successfully" });
	} catch (error) {
		console.error(`❌ Stop WebVNC error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Restart WebVNC instance
async function restartWebVNCInstance(req, res) {
	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		await serviceManager.WebVNCService.restartInstance(name);
		res.json({ message: "WebVNC instance restarted successfully" });
	} catch (error) {
		console.error(`❌ Restart WebVNC error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Delete WebVNC instance
async function deleteWebVNCInstance(req, res) {
	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		await serviceManager.WebVNCService.deleteInstance(name);
		res.json({ message: "WebVNC instance deleted successfully" });
	} catch (error) {
		console.error(`❌ Delete WebVNC error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Update WireGuard config
async function updateWireguardConfig(req, res) {
	const { name, config } = req.body;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	if (!config) {
		return res.status(400).json({ error: "WireGuard config is required" });
	}

	try {
		await storageManager.RemoteVNC.updateWireguard(name, config);
		await serviceManager.WebVNCService.recreateInstance(name);
		res.json({ message: "WireGuard config updated successfully" });
	} catch (error) {
		console.error(`❌ Update WireGuard config error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Add login user
async function addLoginUser(req, res) {
	const { name, username, password } = req.body;

	if (!name || !username || !password) {
		return res.status(400).json({ error: "Instance name, username, and password are required" });
	}

	try {
		await storageManager.RemoteVNC.addLoginUser(name, username, password);
		await serviceManager.WebVNCService.recreateInstance(name);
		res.json({ message: "Login user added successfully" });
	} catch (error) {
		console.error(`❌ Add login user error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Remove login user
async function removeLoginUser(req, res) {
	const { name, username } = req.body;

	if (!name || !username) {
		return res.status(400).json({ error: "Instance name and username are required" });
	}

	try {
		await storageManager.RemoteVNC.removeLoginUser(name, username);
		await serviceManager.WebVNCService.recreateInstance(name);
		res.json({ message: "Login user removed successfully" });
	} catch (error) {
		console.error(`❌ Remove login user error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Get login users
async function getLoginUsers(req, res) {
	const { name } = req.params;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		const users = await storageManager.RemoteVNC.getLoginUsers(name);
		res.json(users);
	} catch (error) {
		console.error(`❌ Get login users error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Add VNC device
async function addVncDevice(req, res) {
	const { name, device } = req.body;

	if (!name || !device) {
		return res.status(400).json({ error: "Instance name and device are required" });
	}

	if (!device.name || !device.ip || !device.port) {
		return res.status(400).json({ error: "Device must have name, ip, port, and path" });
	}

	device.path = utils.sanitizeServiceName(device.name);

	try {
		await storageManager.RemoteVNC.addVncDevice(name, device);
		await serviceManager.WebVNCService.recreateInstance(name);
		res.json({ message: "VNC device added successfully" });
	} catch (error) {
		console.error(`❌ Add VNC device error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Remove VNC device
async function removeVncDevice(req, res) {
	const { name, deviceName } = req.body;

	if (!name || !deviceName) {
		return res.status(400).json({ error: "Instance name and device name are required" });
	}

	try {
		await storageManager.RemoteVNC.removeVncDevice(name, deviceName);
		await serviceManager.WebVNCService.recreateInstance(name);
		res.json({ message: "VNC device removed successfully" });
	} catch (error) {
		console.error(`❌ Remove VNC device error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

// Get VNC devices
async function getVncDevices(req, res) {
	const { name } = req.params;

	if (!name) {
		return res.status(400).json({ error: "Invalid instance name" });
	}

	try {
		const devices = await storageManager.RemoteVNC.getVncDevices(name);
		res.json(devices);
	} catch (error) {
		console.error(`❌ Get VNC devices error: ${error.message}`);
		res.status(500).json({ error: error.message });
	}
}

module.exports = {
	getWebVNCInstance,
	createWebVNCInstance,
	startWebVNCInstance,
	stopWebVNCInstance,
	restartWebVNCInstance,
	deleteWebVNCInstance,
	updateWireguardConfig,
	addLoginUser,
	removeLoginUser,
	getLoginUsers,
	addVncDevice,
	removeVncDevice,
	getVncDevices
};