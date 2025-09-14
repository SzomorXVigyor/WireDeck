function sanitizeServiceName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function ipv4ToIpv6Cidr(ipv4Cidr) {
  const ipv4 = ipv4Cidr.split('/')[0]; // e.g. '172.20.0.10'
  const [a, b, c, d] = ipv4.split('.').map(Number);
  // Embed 2 octets (or more if desired)
  return `fd00:${a.toString(16)}:${b.toString(16)}::/64`;
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function checkPasswordStrength(password, minLength = 12, requestsCapital = 1, requestsNumber = 1, requestsSpecial = 0) {
  const capitalLetters = password.replace(/[^A-Z]/g, '').length;
  const numbers = password.replace(/[^0-9]/g, '').length;
  const specialCharacters = password.replace(/[a-zA-Z0-9]/g, '').length;

  if (password.length < minLength) {
    return [false, `Password must be at least ${minLength} characters long.`];
  }
  if (capitalLetters < requestsCapital) {
    return [false, `Password must contain at least ${requestsCapital} uppercase letter(s).`];
  }
  if (numbers < requestsNumber) {
    return [false, `Password must contain at least ${requestsNumber} number(s).`];
  }
  if (specialCharacters < requestsSpecial) {
    return [false, `Password must contain at least ${requestsSpecial} special character(s).`];
  }
  return [true, ''];
}

module.exports = {
  sanitizeServiceName,
  ipv4ToIpv6Cidr,
  generateRandomString,
  checkPasswordStrength,
};
