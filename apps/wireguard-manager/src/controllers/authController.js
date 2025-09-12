const jwt = require('jsonwebtoken');
const storageManager = require('../modules/storageManager');
const logger = require('../modules/logger');

const JWT_SECRET = process.env.JWT_SECRET;

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('[Auth] Token missing in request headers');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('[Auth] Invalid or expired token provided');
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    logger.debug(`[Auth] Token verified for user: ${user.username}`);
    next();
  });
}

// Login endpoint
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    logger.warn('[Auth] Login validation failed: Missing username or password');
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const isValid = await storageManager.UserHandler.validateUser(username, password);
    if (!isValid) {
      logger.warn(`[Auth] Login failed: Invalid credentials for user=${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    logger.info(`[Auth] User logged in successfully: ${username}`);
    res.json({ token, username, message: 'Login successful' });
  } catch (error) {
    logger.error(`[Auth] Login error: ${error.message}, user=${username}`);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Change password endpoint
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const username = req.user.username;

  if (!currentPassword || !newPassword) {
    logger.warn(`[Auth] Change password validation failed: Missing fields, user=${username}`);
    return res.status(400).json({ error: 'Current password and new password required' });
  }

  if (newPassword.length < 6) {
    logger.warn(`[Auth] Change password validation failed: New password too short, user=${username}`);
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    const isValidCurrent = await storageManager.UserHandler.validateUser(username, currentPassword);
    if (!isValidCurrent) {
      logger.warn(`[Auth] Change password failed: Incorrect current password, user=${username}`);
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await storageManager.UserHandler.updatePassword(username, newPassword);

    logger.info(`[Auth] Password changed successfully for user=${username}`);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error(`[Auth] Password change error: ${error.message}, user=${username}`);
    res.status(500).json({ error: 'Password change failed' });
  }
}

module.exports = {
  authenticateToken,
  login,
  changePassword,
};
