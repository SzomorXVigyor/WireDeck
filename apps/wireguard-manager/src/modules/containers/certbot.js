const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const utils = require("../utils");
const logger = require("../logger");

const CERTBOT_EMAIL = process.env.CERTBOT_EMAIL;
const usedImage = "certbot/certbot";

class CertbotContainer {
    constructor(domain) {
        this.domain = domain;
        this.containerName = `certbot-${utils.sanitizeServiceName(this.domain)}`;
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
            domain,
        ];
        this.renewCMD = [
            "renew",
            "--webroot",
            "--webroot-path=/var/www/certbot",
            "--cert-name",
            domain,
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
                    Binds: [
                        "/etc/letsencrypt:/etc/letsencrypt",
                        "/var/www/certbot:/var/www/certbot"
                    ],
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

            // Pipe container logs
            stream.pipe(process.stdout);

            await container.start();

            const result = await container.wait();

            if (result.StatusCode !== 0) {
                throw new Error(`Container exited with status code: ${result.StatusCode}`);
            }

            logger.info(`[Certbot] Container finished successfully for domain=${this.domain}`);
        } catch (error) {
            logger.error(`[Certbot] Container run error: ${error.message}, domain=${this.domain}`);
            throw error;
        }
    }

    async createCertificate() {
        try {
            logger.info(`[Certbot] Creating certificate for domain=${this.domain}`);
            await this.#runCertbotContainer(this.createCMD);
            logger.info(`[Certbot] Certificate created successfully for domain=${this.domain}`);
        } catch (error) {
            logger.error(`[Certbot] Certificate creation error: ${error.message}, domain=${this.domain}`);
            throw error;
        }
    }

    async renewCertificate() {
        try {
            logger.info(`[Certbot] Renewing certificate for domain=${this.domain}`);
            await this.#runCertbotContainer(this.renewCMD);
            logger.info(`[Certbot] Certificate renewed successfully for domain=${this.domain}`);
        } catch (error) {
            logger.error(`[Certbot] Certificate renewal error: ${error.message}, domain=${this.domain}`);
        }
    }
}

module.exports = CertbotContainer;
