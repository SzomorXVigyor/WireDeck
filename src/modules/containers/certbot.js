const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const utils = require("../utils");

const CERTBOT_EMAIL = process.env.CERTBOT_EMAIL;

const usedImage = "certbot/certbot";

class CertbotContainer {
    constructor(name) {
        this.name = utils.sanitizeServiceName(name);
        this.containerName = `certbot-${this.name}`;
        this.createCMD = [
			"certonly",
			"--webroot",
			"--non-interactive",
			"--webroot-path=/var/www/certbot",
			"--email",
			CERTBOT_EMAIL,
			"--agree-tos",
			"--no-eff-email",
			"-d",
			containerName,
		];
        this.renewCMD = [
            "renew",
            "--webroot",
            "--webroot-path=/var/www/certbot",
            "--cert-name",
            containerName,
        ];

    }

    async #runCertbotContainer(cmd) {
        try {
            const container = await docker.createContainer({
                name: this.containerName,
                Image: usedImage,
                Cmd: cmd,
                HostConfig: {
                    AutoRemove: true,
                    Binds: ["/etc/letsencrypt:/etc/letsencrypt", "/var/www/certbot:/var/www/certbot"],
                    NetworkMode: "wgnet",
                },
                AttachStdout: true,
                AttachStderr: true,
            });

            const stream = await container.attach({
                stream: true,
                stdout: true,
                stderr: true,
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

    async createCertificate() {
        try {
            console.log(`🔒 Creating certificate for: ${this.name}`);
            this.#runCertbotContainer(this.createCMD);
            console.log(`✅ Certificate created for: ${domain}`);
        } catch (error) {
            console.error(`❌ Certificate creation failed for ${domain}:`, error.message);
            throw error;
        }
    }

    async renewCertificate() {
        try {
            console.log(`🔄 Renewing certificate for: ${this.name}`);
            this.#runCertbotContainer(this.renewCMD);
            console.log(`✅ Certificate renewed for: ${domain}`);
        } catch (error) {
            console.error(`❌ Certificate renewal failed for ${domain}:`, error.message);
        }
    }
}

module.exports = CertbotContainer;