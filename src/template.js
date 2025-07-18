require("dotenv").config();

// Function to sanitize service names for Docker Compose
function sanitizeServiceName(name) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9-_]/g, "-") // Replace invalid characters with hyphens
		.replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
		.replace(/-+/g, "-"); // Replace multiple consecutive hyphens with single hyphen
}

exports.generateComposeFile = (name, index) => {
	const sanitizedName = sanitizeServiceName(name);
	const ipLastOctet = 10 + index;
	const ipv4Address = `172.20.0.${ipLastOctet}`;
	const basePort = 51820 + index * 2;

	return `
volumes:
  etc_wireguard_${sanitizedName}:

networks:
  wgnet:
    external: true

services:
  wg-easy-${sanitizedName}:
    image: ghcr.io/wg-easy/wg-easy:15
    container_name: wg-easy-${sanitizedName}
    networks:
      wgnet:
        ipv4_address: ${ipv4Address}
    volumes:
      - etc_wireguard_${sanitizedName}:/etc/wireguard
      - /lib/modules:/lib/modules:ro
    ports:
      - "${basePort}:51820/udp"
      - "${basePort + 1}:51821/tcp"
    restart: unless-stopped
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    environment:
      - INIT_ENABLED=true
      - INIT_USERNAME=${process.env.INIT_USERNAME}
      - INIT_PASSWORD=${process.env.INIT_PASSWORD}
      - INIT_HOST=${process.env.INIT_HOST}
      - INIT_PORT=51820
      - INIT_DNS=1.1.1.1,8.8.8.8
      - INIT_IPV4_CIDR=172.20.0.0/24
      - INIT_IPV6_CIDR=fd00:172:20::/64
      - DISABLE_IPV6=true
      - PORT=51821
      - HOST=0.0.0.0
      - INSECURE=${process.env.INSECURE}
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv4.conf.all.src_valid_mark=1
  `.trim();
};

// Export the sanitize function for use in other files
exports.sanitizeServiceName = sanitizeServiceName;
