const containerManager = require("../modules/containers/containerManager");

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
		res.status(500).json({
			connected: false,
			error: error.message,
		});
	}
}

module.exports = {
	getDockerStatus
};