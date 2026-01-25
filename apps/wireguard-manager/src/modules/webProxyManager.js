const fs = require('fs');
const path = require('path');
const Docker = require('dockerode');
const logger = require('./logger');

const docker = new Docker();
const SITES_DIR = path.join(__dirname, '../', 'nginx', 'sites');
const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

// Ensure sites directory exists
if (!fs.existsSync(SITES_DIR)) {
  fs.mkdirSync(SITES_DIR, { recursive: true });
}

async function addSite(name, ipv4, reload = true) {
  const domain = `${name}.${ROOT_DOMAIN}`;
  const siteConfig = generateSiteConfig(domain, ipv4);
  const configPath = path.join(SITES_DIR, `${name}.conf`);

  fs.writeFileSync(configPath, siteConfig);
  logger.info(`[WebProxyManager] Nginx site config created: ${configPath}`);

  if (reload) {
    reloadNginx().catch((error) => {
      logger.error(`[WebProxyManager] Failed to reload Nginx after adding site: ${error.message}`);
    });
  }
}

async function removeSite(name, reload = true) {
  const configPath = path.join(SITES_DIR, `${name}.conf`);

  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    logger.info(`[WebProxyManager] Nginx site config removed: ${configPath}`);

    if (reload) {
      reloadNginx().catch((error) => {
        logger.error(`[WebProxyManager] Failed to reload Nginx after removing site: ${error.message}`);
      });
    }
  }
}

function generateSiteConfig(domain, ipv4, fallback = ROOT_DOMAIN) {
  return `
server {
    listen 80;
    server_name ${domain};

    include /etc/nginx/error-pages.conf;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name ${domain};

    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    include /etc/nginx/error-pages.conf;

    location / {
        proxy_pass http://${ipv4}:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 1h;
        proxy_send_timeout 1h;
    }
}
`.trim();
}

async function reloadNginx() {
  try {
    logger.info('[WebProxyManager] Reloading Nginx...');

    const containers = await docker.listContainers();
    const nginxContainer = containers.find((container) => container.Names.some((name) => name.includes('nginx-proxy')));

    if (!nginxContainer) {
      throw new Error('nginx-proxy container not found');
    }

    const container = docker.getContainer(nginxContainer.Id);

    setTimeout(async () => {
      try {
        const reloadExec = await container.exec({
          Cmd: ['nginx', '-s', 'reload'],
          AttachStdout: true,
          AttachStderr: true,
        });
        await reloadExec.start({ hijack: true, stdin: false });
        logger.info('[WebProxyManager] Nginx reload command sent');
      } catch (error) {
        logger.error(`[WebProxyManager] Nginx reload failed: ${error.message}`);
      }
    }, 500);
  } catch (error) {
    logger.error(`[WebProxyManager] Nginx reload failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  addSite,
  removeSite,
  reloadNginx,
};
