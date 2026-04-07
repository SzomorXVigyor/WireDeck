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
  const ipv4 = ipv4Cidr.split('/')[0]; // e.g. '172.20.0.10'
  const [a, b, c, d] = ipv4.split('.').map(Number);
  // Embed 2 octets (or more if desired)
  return `fd00:${a.toString(16)}:${b.toString(16)}::/64`;
}
