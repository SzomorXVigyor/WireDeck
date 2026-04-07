export function sanitizeServiceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function ipv4ToIpv6Cidr(ipv4Cidr: string): string {
  const parts = ipv4Cidr.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid CIDR notation: "${ipv4Cidr}"`);
  }

  const [ipStr, prefixLenStr] = parts;
  const octets = ipStr.split('.').map(Number);

  if (octets.length !== 4 || octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
    throw new Error(`Invalid IPv4 address: "${ipStr}"`);
  }

  const prefixLen = Number(prefixLenStr);
  if (isNaN(prefixLen) || prefixLen < 0 || prefixLen > 32) {
    throw new Error(`Invalid prefix length: "${prefixLenStr}"`);
  }

  const [a, b, c, d] = octets;

  // Encode all 4 octets: pair them into two 16-bit hex groups
  const seg1 = ((a << 8) | b).toString(16).padStart(4, '0');
  const seg2 = ((c << 8) | d).toString(16).padStart(4, '0');

  // Map IPv4 /32 → IPv6 /128, adjust proportionally (add 96 for IPv4-mapped space)
  const ipv6PrefixLen = Math.min(prefixLen + 96, 128);

  return `fd00:${seg1}:${seg2}::/${ipv6PrefixLen}`;
}
