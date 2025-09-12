const CertbotContainer = require('./containers/certbot');
const { WireguardServer: WireguardServerStorage, RemoteVNC: RemoteVNCStorage } = require('./storageManager');
const webProxyManager = require('./webProxyManager');
const logger = require('./logger');

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

async function createCertificate(subDomain) {
  let domain = subDomain ? `${subDomain}.${ROOT_DOMAIN}` : ROOT_DOMAIN;
  const certbot = new CertbotContainer(domain);

  try {
    logger.info(`[CertificateManager] Creating certificate for domain: ${domain}...`);
    await certbot.createCertificate();
    logger.info(`[CertificateManager] Certificate created successfully for domain: ${domain}`);
  } catch (error) {
    logger.error(`[CertificateManager] Failed to create certificate for domain '${domain}': ${error.message}`);
    throw error;
  }
}

async function renewCertificate(subDomain) {
  let domain = subDomain ? `${subDomain}.${ROOT_DOMAIN}` : ROOT_DOMAIN;
  const certbot = new CertbotContainer(domain);

  try {
    logger.info(`[CertificateManager] Renewing certificate for domain: ${domain}...`);
    await certbot.renewCertificate();
    logger.info(`[CertificateManager] Certificate renewed successfully for domain: ${domain}`);
  } catch (error) {
    logger.error(`[CertificateManager] Failed to renew certificate for domain '${domain}': ${error.message}`);
    throw error;
  }
}

async function renewExistingCertificates() {
  try {
    logger.info('[CertificateManager] Renewing all existing certificates...');

    const instances = await WireguardServerStorage.getAll();

    // Renew root domain certificate
    await renewCertificate();

    for (const [name] of Object.entries(instances)) {
      await renewCertificate(name);

      if (await RemoteVNCStorage.exists(name)) {
        await renewCertificate(`vnc.${name}`);
      }
    }

    logger.info('[CertificateManager] Reloading Nginx after certificate renewal...');
    webProxyManager.reloadNginx();

    logger.info('[CertificateManager] All certificates renewed successfully');
  } catch (error) {
    logger.error(`[CertificateManager] Failed to renew existing certificates: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createCertificate,
  renewExistingCertificates,
};
