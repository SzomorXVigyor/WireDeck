const storageManager = require('../modules/storageManager');
const serviceManager = require('../modules/serviceManager');
const utils = require('../modules/utils');
const logger = require('../modules/logger');

// Create new WebView instance
async function createWebViewInstance(req, res) {
  const { name, wireguardConfig, loginUsers } = req.body;

  if (!name || typeof name !== 'string') {
    logger.warn('[WebViewController] Create instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebViewController] Creating instance: ' + name + '...');

    const wireguardInstance = await storageManager.WireguardServer.get(name);
    if (!wireguardInstance) {
      logger.warn('[WebViewController] Wireguard instance not found: ' + name);
      return res.status(404).json({ error: 'Wireguard instance not found' });
    }

    if (!wireguardConfig || typeof wireguardConfig !== 'string') {
      logger.warn('[WebViewController] Invalid wireguard config provided');
      return res.status(400).json({ error: 'Valid wireguard configuration is required' });
    }

    if (wireguardInstance.webView) {
      logger.warn('[WebViewController] WebView instance already exists: ' + name);
      return res.status(409).json({ error: 'WebView instance already exists for this wireguard instance' });
    }

    if (loginUsers && !Array.isArray(loginUsers)) {
      logger.warn('[WebViewController] Invalid login users format');
      return res.status(400).json({ error: 'loginUsers must be an array' });
    }

    // Validate user roles
    if (loginUsers) {
      for (const user of loginUsers) {
        if (!user.username || !user.password || !user.role) {
          logger.warn('[WebViewController] Invalid user object - missing username, password, or role');
          return res.status(400).json({ error: 'Each user must have username, password, and role (admin or user)' });
        }
        if (!['admin', 'user'].includes(user.role)) {
          logger.warn('[WebViewController] Invalid user role: ' + user.role);
          return res.status(400).json({ error: 'User role must be either "admin" or "user"' });
        }
      }
    }

    const options = {
      wireguardConfig: wireguardConfig || '',
      loginUsers: loginUsers || [],
    };

    const result = await serviceManager.WebViewService.createInstance(name, options);

    logger.info('[WebViewController] Instance created successfully: ' + name);
    res.json(result);
  } catch (error) {
    logger.error("[WebViewController] Failed to create instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Start WebView instance
async function startWebViewInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WebViewController] Start instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebViewController] Starting instance: ' + name + '...');
    await serviceManager.WebViewService.startInstance(name);

    logger.info('[WebViewController] Instance started successfully: ' + name);
    res.json({ message: 'WebView instance started successfully' });
  } catch (error) {
    logger.error("[WebViewController] Failed to start instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Stop WebView instance
async function stopWebViewInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WebViewController] Stop instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebViewController] Stopping instance: ' + name + '...');
    await serviceManager.WebViewService.stopInstance(name);

    logger.info('[WebViewController] Instance stopped successfully: ' + name);
    res.json({ message: 'WebView instance stopped successfully' });
  } catch (error) {
    logger.error("[WebViewController] Failed to stop instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Restart WebView instance
async function restartWebViewInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WebViewController] Restart instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebViewController] Restarting instance: ' + name + '...');
    await serviceManager.WebViewService.restartInstance(name);

    logger.info('[WebViewController] Instance restarted successfully: ' + name);
    res.json({ message: 'WebView instance restarted successfully' });
  } catch (error) {
    logger.error("[WebViewController] Failed to restart instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Delete WebView instance
async function deleteWebViewInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WebViewController] Delete instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebViewController] Deleting instance: ' + name + '...');
    await serviceManager.WebViewService.deleteInstance(name);

    logger.info('[WebViewController] Instance deleted successfully: ' + name);
    res.json({ message: 'WebView instance deleted successfully' });
  } catch (error) {
    logger.error("[WebViewController] Failed to delete instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Recreate WebView instance
async function recreateWebViewInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WebViewController] Recreate instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebViewController] Recreating instance: ' + name + '...');
    await serviceManager.WebViewService.recreateInstance(name, true);

    logger.info('[WebViewController] Instance recreated successfully: ' + name);
    res.json({ message: 'WebView instance recreated successfully' });
  } catch (error) {
    logger.error("[WebViewController] Failed to recreate instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Add login user
async function addLoginUser(req, res) {
  const { name, username, password, role } = req.body;

  if (!name || !username || !password || !role) {
    logger.warn('[WebViewController] Add login user failed: Missing parameters');
    return res.status(400).json({ error: 'Instance name, username, password, and role are required' });
  }

  if (!['admin', 'user'].includes(role)) {
    logger.warn('[WebViewController] Add login user failed: Invalid role');
    return res.status(400).json({ error: 'Role must be either "admin" or "user"' });
  }

  try {
    logger.info("[WebViewController] Adding login user '" + username + "' to instance: " + name + '...');
    const changeToken = utils.generateRandomString(32);
    await storageManager.WebView.addLoginUser(name, username, password, role, changeToken);
    await serviceManager.WebViewService.recreateInstance(name);

    logger.info("[WebViewController] Login user '" + username + "' added successfully to instance: " + name);
    res.json({ message: 'Login user added successfully' });
  } catch (error) {
    logger.error("[WebViewController] Failed to add login user '" + username + "' to instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Remove login user
async function removeLoginUser(req, res) {
  const { name, username } = req.body;

  if (!name || !username) {
    logger.warn('[WebViewController] Remove login user failed: Missing parameters');
    return res.status(400).json({ error: 'Instance name and username are required' });
  }

  try {
    logger.info("[WebViewController] Removing login user '" + username + "' from instance: " + name + '...');
    await storageManager.WebView.removeLoginUser(name, username);
    await serviceManager.WebViewService.recreateInstance(name);

    logger.info("[WebViewController] Login user '" + username + "' removed successfully from instance: " + name);
    res.json({ message: 'Login user removed successfully' });
  } catch (error) {
    logger.error("[WebViewController] Failed to remove login user '" + username + "' from instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Change WebView password (for third-party requests)
async function changeViewPassword(req, res) {
  const { instance, username, changeToken } = req.query;
  const { oldPassword, newPassword } = req.body;

  if (!instance || !username || !oldPassword || !newPassword || !changeToken) {
    logger.warn('[WebViewController] Change password failed: Missing parameters');
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    logger.info("[WebViewController] Attempting password change for user '" + username + "' in instance: " + instance + "'");

    const isValid = await storageManager.WebView.validateLoginUser(instance, username, oldPassword);
    if (!isValid) {
      logger.warn('[WebViewController] Invalid credentials for password change');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isTokenValid = await storageManager.WebView.validateChangeToken(instance, username, changeToken);
    if (!isTokenValid) {
      logger.warn("[WebViewController] Invalid change token for user '" + username + "'");
      return res.status(401).json({ error: 'Invalid or expired change token' });
    }

    await storageManager.WebView.changeUserPasswordByToken(instance, username, newPassword, changeToken);
    await serviceManager.WebViewService.recreateInstance(instance);

    logger.info("[WebViewController] Password changed successfully for user '" + username + "' in instance: " + instance);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error("[WebViewController] Failed to change password for user '" + username + "' in instance '" + instance + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createWebViewInstance,
  startWebViewInstance,
  stopWebViewInstance,
  restartWebViewInstance,
  deleteWebViewInstance,
  recreateWebViewInstance,
  addLoginUser,
  removeLoginUser,
  changeViewPassword,
};
