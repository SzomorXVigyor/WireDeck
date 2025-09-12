const containerManager = require("../modules/containers/containerManager");
const logger = require("../modules/logger");

// Docker status endpoint
async function getDockerStatus(req, res) {
	try {
		const info = await containerManager.dockerInfo();
		res.json({
			connected: true,
			version: info.ServerVersion,
			os: info.OperatingSystem,
			containers: info.Containers,
			containersRunning: info.ContainersRunning,
			images: info.Images,
		});
	} catch (error) {
		logger.error("[DockerController] Docker status error:", error.message);
		res.status(500).json({
			connected: false,
			error: error.message,
		});
	}
}

module.exports = {
	getDockerStatus
};