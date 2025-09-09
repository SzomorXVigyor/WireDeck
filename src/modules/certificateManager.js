const CertbotContainer = require("./containers/certbot");
const { WireguardServer: WireguardServerStorage, RemoteVNC: RemoteVNCStorage } = require("./storageManager");
const webProxyManager = require("./webProxyManager");

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

async function createCertificate(subDomain) {
	let domain;
	if (subDomain) {
		domain = `${subDomain}.${ROOT_DOMAIN}`;
	} else {
		domain = ROOT_DOMAIN;
	}
	const certbot = new CertbotContainer(domain);
	await certbot.createCertificate();
}

async function renewCertificate(subDomain) {
	let domain;
	if (subDomain) {
		domain = `${subDomain}.${ROOT_DOMAIN}`;
	} else {
		domain = ROOT_DOMAIN;
	}
	const certbot = new CertbotContainer(domain);
	await certbot.renewCertificate();
}

async function renewExistingCertificates() {
	const instances = await WireguardServerStorage.getAll();

	await renewCertificate();

	for (const [name] of Object.entries(instances)) {
		await renewCertificate(name);

		if(await RemoteVNCStorage.exists(name)) {
			await renewCertificate(`vnc.${name}`);
		}
	}

	// Reload nginx after renewal
	webProxyManager.reloadNginx();
}

module.exports = {
	createCertificate,
	renewExistingCertificates,
};
