function sanitizeServiceName(name) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9-_]/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-+/g, "-");
}

function ipv4ToIpv6Cidr(ipv4Cidr) {
	const ipv4 = ipv4Cidr.split("/")[0]; // e.g. '172.20.0.10'
	const [a, b, c, d] = ipv4.split(".").map(Number);
	// Embed 2 octets (or more if desired)
	return `fd00:${a.toString(16)}:${b.toString(16)}::/64`;
}

async function checkContainerStatus(docker, containerName) {
	try {
		const containers = await docker.listContainers({ all: true });
		const container = containers.find((c) => c.Names.some((name) => name === `/${containerName}`));

		return container ? container.State === "running" : false;
	} catch (error) {
		console.error(`Error checking container status: ${error.message}`);
		return false;
	}
}

async function removeContainer(docker, containerName) {
	try {
		const container = docker.getContainer(containerName);
		await container.stop();
		await container.remove();
		console.log(`🗑️ Container removed: ${containerName}`);
	} catch (error) {
		console.error(`❌ Error removing container: ${error.message}`);
	}
}

module.exports = {
	sanitizeServiceName,
	ipv4ToIpv6Cidr,
	checkContainerStatus,
	removeContainer,
};
