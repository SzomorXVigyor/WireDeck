const express = require("express");
const cron = require("node-cron");
const storageManager = require("./modules/storageManager");
const certificateManager = require("./modules/certificateManager");
const containerManager = require("./modules/containers/containerManager");
const serviceManager = require("./modules/serviceManager");
const logger = require("./modules/logger");

// Import routes
const authRoutes = require("./routes/authRoutes");
const dockerRoutes = require("./routes/dockerRoutes");
const wireguardRoutes = require("./routes/wireguardRoutes");
const webvncRoutes = require("./routes/webvncRoutes");

// Required environment variables
const requiredEnvVars = ["ROOT_DOMAIN", "INIT_USERNAME", "INIT_PASSWORD", "CERTBOT_EMAIL", "JWT_SECRET"];

// Check required environment variables
requiredEnvVars.forEach((envVar) => {
	if (!process.env[envVar]) {
		logger.error(`Missing required environment variable: ${envVar}`);
		process.exit(1);
	}
});

// Check default password length
if (process.env.INIT_PASSWORD.length < 12) {
	logger.error("Default ENV password must be at least 12 characters long");
	process.exit(1);
}

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

// Use routes
app.use("/auth", authRoutes);
app.use("/docker", dockerRoutes);
app.use("/wireguard", wireguardRoutes);
app.use("/webvnc", webvncRoutes);

// Initialize default user
async function initializeDefaultUser() {
	const users = await storageManager.UserHandler.getAll();
	if (users.length === 0) {
		await storageManager.UserHandler.createUser(process.env.INIT_USERNAME, process.env.INIT_PASSWORD);
		logger.info(`Default user created: ${process.env.INIT_USERNAME}`);
	}
}

app.get("*", (req, res) => {
	res.redirect(301, "/");
});

// Schedule certificate renewal every week (Sundays at 2 AM)
cron.schedule("0 2 * * 0", async () => {
	logger.info("Running weekly certificate renewal...");
	try {
		await certificateManager.renewExistingCertificates();
		logger.info("Weekly certificate renewal completed");
	} catch (error) {
		logger.error("Weekly certificate renewal failed:", error.message);
	}
});

// Test Docker connection
async function testDockerConnection() {
	try {
		const info = await containerManager.dockerInfo();
		if (!info || !info.ServerVersion) throw new Error("Invalid Docker response");
		logger.info("Docker connection successful");
		return true;
	} catch (error) {
		logger.error("Docker connection failed:", error.message);
		process.exit(1);
	}
}

// Start server
async function startServer() {
	await testDockerConnection();
	await initializeDefaultUser();

	await serviceManager.initServices();

	// Run certificate renewal on startup
	try {
		await certificateManager.renewExistingCertificates();
		logger.info("Startup certificate renewal completed");
	} catch (error) {
		logger.error("Startup certificate renewal failed:", error.message);
	}

	app.listen(PORT, () => {
		logger.info(`Server running on port ${PORT}`);
		logger.info(`Root domain: ${ROOT_DOMAIN}`);
		logger.info("Certificate renewal scheduled: Every Sunday at 2 AM");
	});
}

startServer().catch((error) => logger.error("Server failed to start:", error));