const certbotContainer = require("./containers/certbot");
const { WireguardServer: WireguardServerStorage, RemoteVNC: RemoteVNCStorage } = require("./storageManager");
const webProxyManager = require("./webProxyManager");

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

async function createCertificate(domain) {
	const certbot = new certbotContainer(domain);
	await certbot.createCertificate();
}

async function renewCertificate(domain) {
	const certbot = new certbotContainer(domain);
	await certbot.renewCertificate();
}

async function renewExistingCertificates() {
	const services = WireguardServerStorage.getAll();

	await renewCertificate(ROOT_DOMAIN);

	for (const [name] of Object.entries(services.instances)) {
		const domain = `${name}.${ROOT_DOMAIN}`;
		await renewCertificate(domain);

		if(RemoteVNCStorage.exists(name)) {
			await renewCertificate(`vnc.${domain}`);
		}
	}

	// Reload nginx after renewal
	webProxyManager.reloadNginx();
}

module.exports = {
	createCertificate,
	renewExistingCertificates,
};
