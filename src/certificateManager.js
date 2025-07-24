const Docker = require('dockerode');
const storageManager = require('./storageManager');
const webProxyManager = require('./webProxyManager');

const docker = new Docker();
const CERTBOT_EMAIL = process.env.CERTBOT_EMAIL;
const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

async function runCertbotContainer(command, domain) {
  try {
    console.log(`🐳 Starting certbot container for: ${domain}`);
    
    const container = await docker.createContainer({
	  name: `temp-certbot-${domain}`,				
      Image: 'certbot/certbot',
      Cmd: command,
      HostConfig: {
        AutoRemove: true,
        Binds: [
          '/etc/letsencrypt:/etc/letsencrypt',
          '/var/www/certbot:/var/www/certbot'
        ],
        NetworkMode: 'wgnet'
      },
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true
    });

    // Pipe container output to console
    stream.pipe(process.stdout);

    await container.start();
    
    // Wait for container to finish
    const result = await container.wait();
    
    if (result.StatusCode !== 0) {
      throw new Error(`Container exited with status code: ${result.StatusCode}`);
    }

    console.log(`✅ Certbot container completed successfully for: ${domain}`);
    
  } catch (error) {
    console.error(`❌ Certbot container failed for ${domain}:`, error.message);
    throw error;
  }
}

async function createCertificate(domain) {
  try {
    console.log(`🔒 Creating certificate for: ${domain}`);
    
    const command = [
      'certonly',
      '--webroot',
	  '--non-interactive',
      '--webroot-path=/var/www/certbot',
      '--email', CERTBOT_EMAIL,
      '--agree-tos',
      '--no-eff-email',
      '-d', domain
    ];
    
    await runCertbotContainer(command, domain);
    
    console.log(`✅ Certificate created for: ${domain}`);
  } catch (error) {
    console.error(`❌ Certificate creation failed for ${domain}:`, error.message);
    throw error;
  }
}

async function renewCertificate(domain) {
  try {
    console.log(`🔄 Renewing certificate for: ${domain}`);
    
    const command = [
      'renew',
      '--webroot',
      '--webroot-path=/var/www/certbot',
      '--cert-name', domain
    ];
    
    await runCertbotContainer(command, domain);
    
    console.log(`✅ Certificate renewed for: ${domain}`);
  } catch (error) {
    console.error(`❌ Certificate renewal failed for ${domain}:`, error.message);
  }
}

async function renewExistingCertificates() {
  const state = storageManager.loadState();

  await renewCertificate(ROOT_DOMAIN);
  
  for (const [name] of Object.entries(state.instances)) {
    const domain = `${name}.${ROOT_DOMAIN}`;
    await renewCertificate(domain);
  }

  // Reload nginx after renewal
  webProxyManager.reloadNginx();
}

module.exports = {
  createCertificate,
  renewExistingCertificates
};