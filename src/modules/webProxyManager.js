const fs = require("fs");
const path = require("path");
const Docker = require("dockerode");

const docker = new Docker();
const SITES_DIR = path.join("../", "nginx", "sites");
const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

// Ensure sites directory exists
if (!fs.existsSync(SITES_DIR)) {
	fs.mkdirSync(SITES_DIR, { recursive: true });
}

async function addSite(name, ipv4) {
	const domain = `${name}.${ROOT_DOMAIN}`;
	const siteConfig = generateSiteConfig(domain, ipv4);
	const configPath = path.join(SITES_DIR, `${name}.conf`);

	fs.writeFileSync(configPath, siteConfig);
	console.log(`📝 Nginx site config created: ${configPath}`);

	await reloadNginx();
}

async function removeSite(name) {
	const configPath = path.join(SITES_DIR, `${name}.conf`);

	if (fs.existsSync(configPath)) {
		fs.unlinkSync(configPath);
		console.log(`🗑️ Nginx site config removed: ${configPath}`);
		await reloadNginx();
	}
}

function generateSiteConfig(domain, ipv4, fallback = ROOT_DOMAIN) {
	return `
  server {
      listen 80;
      server_name ${domain};
  
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
  
      location / {
          proxy_pass http://${ipv4}:80;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_buffering off;

          proxy_read_timeout 10s;

          error_page 502 504 = @fallback;
      }
  
      location @fallback {
          return 302 https://${fallback};
      }
  }
  `.trim();
}

async function reloadNginx() {
	try {
		console.log("🔄 Reloading Nginx...");

		// Find the nginx-proxy container
		const containers = await docker.listContainers();
		const nginxContainer = containers.find((container) => container.Names.some((name) => name.includes("nginx-proxy")));

		if (!nginxContainer) {
			throw new Error("nginx-proxy container not found");
		}

		const container = docker.getContainer(nginxContainer.Id);

		// First, regenerate the config with envsubst to handle any new sites
		const envsubstExec = await container.exec({
			Cmd: ["/bin/sh", "-c", `envsubst '$$ROOT_DOMAIN' < /etc/nginx/nginx.conf > /tmp/nginx.conf`],
			AttachStdout: true,
			AttachStderr: true,
		});

		const envsubstStream = await envsubstExec.start({
			hijack: true,
			stdin: false,
		});

		// Wait for envsubst to complete
		await new Promise((resolve, reject) => {
			envsubstStream.on("end", async () => {
				try {
					const inspect = await envsubstExec.inspect();
					if (inspect.ExitCode === 0) {
						resolve();
					} else {
						reject(new Error(`envsubst failed with exit code: ${inspect.ExitCode}`));
					}
				} catch (error) {
					reject(error);
				}
			});
			envsubstStream.on("error", reject);
		});

		// Now reload nginx with the correct config file
		const reloadExec = await container.exec({
			Cmd: ["kill", "-HUP", "1"],
			AttachStdout: true,
			AttachStderr: true,
		});

		const reloadStream = await reloadExec.start({
			hijack: true,
			stdin: false,
		});

		// Wait for reload to complete
		await new Promise((resolve, reject) => {
			reloadStream.on("end", async () => {
				try {
					const inspect = await reloadExec.inspect();
					if (inspect.ExitCode === 0) {
						console.log("✅ Nginx reloaded successfully");
						resolve();
					} else {
						reject(new Error(`Nginx reload failed with exit code: ${inspect.ExitCode}`));
					}
				} catch (error) {
					reject(error);
				}
			});
			reloadStream.on("error", reject);
		});
	} catch (error) {
		console.error("❌ Nginx reload failed:", error.message);
		throw error;
	}
}

module.exports = {
	addSite,
	removeSite,
	reloadNginx,
};
