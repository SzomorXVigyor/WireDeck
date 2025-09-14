const storageManager = require('../modules/storageManager');
const serviceManager = require('../modules/serviceManager');
const utils = require('../modules/utils');
const logger = require('../modules/logger');

// Create new WebVNC instance
async function createWebVNCInstance(req, res) {
  const { name, wireguardConfig, loginUsers, vncDevices } = req.body;

  if (!name || typeof name !== 'string') {
    logger.warn('[WebVNCController] Create instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebVNCController] Creating instance: ' + name + '...');

    const wireguardInstance = await storageManager.WireguardServer.get(name);
    if (!wireguardInstance) {
      logger.warn("[WebVNCController] Create instance failed: WireGuard '" + name + "' not found");
      return res.status(404).json({ error: 'WireGuard instance not found' });
    }

    if (!wireguardConfig || typeof wireguardConfig !== 'string') {
      logger.warn("[WebVNCController] Create instance failed: Invalid WireGuard config for '" + name + "'");
      return res.status(400).json({ error: 'Invalid WireGuard config' });
    }

    if (wireguardInstance.remoteVNC) {
      logger.warn("[WebVNCController] Create instance failed: Already exists for '" + name + "'");
      return res.status(400).json({ error: 'WebVNC already exists for this instance' });
    }

    if (loginUsers) {
      for (const user of loginUsers) {
        if (!user.username || !user.password) {
          logger.warn('[WebVNCController] Create instance failed: Invalid login user -> ' + JSON.stringify(user));
          return res.status(400).json({ error: 'Each login user must have username and password' });
        }
        // Add passwordChangeToken for third-party password change requests
        const changeToken = utils.generateRandomString(32);
        user.passwordChangeToken = changeToken;
      }
    }

    if (vncDevices) {
      for (const device of vncDevices) {
        if (!device.name || !device.ip || !device.port) {
          logger.warn('[WebVNCController] Create instance failed: Invalid VNC device -> ' + JSON.stringify(device));
          return res.status(400).json({ error: 'Each VNC device must have name, ip, and port' });
        }
      }
    }

    const options = {
      wireguardConfig: wireguardConfig || '',
      loginUsers: loginUsers || [],
      vncDevices: vncDevices || [],
    };

    const result = await serviceManager.WebVNCService.createInstance(name, options);

    logger.info('[WebVNCController] Instance created successfully: ' + name);
    res.json(result);
  } catch (error) {
    logger.error("[WebVNCController] Failed to create instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Start WebVNC instance
async function startWebVNCInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WebVNCController] Start instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebVNCController] Starting instance: ' + name + '...');
    await serviceManager.WebVNCService.startInstance(name);

    logger.info('[WebVNCController] Instance started successfully: ' + name);
    res.json({ message: 'WebVNC instance started successfully' });
  } catch (error) {
    logger.error("[WebVNCController] Failed to start instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Stop WebVNC instance
async function stopWebVNCInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WebVNCController] Stop instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebVNCController] Stopping instance: ' + name + '...');
    await serviceManager.WebVNCService.stopInstance(name);

    logger.info('[WebVNCController] Instance stopped successfully: ' + name);
    res.json({ message: 'WebVNC instance stopped successfully' });
  } catch (error) {
    logger.error("[WebVNCController] Failed to stop instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Restart WebVNC instance
async function restartWebVNCInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WebVNCController] Restart instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebVNCController] Restarting instance: ' + name + '...');
    await serviceManager.WebVNCService.restartInstance(name);

    logger.info('[WebVNCController] Instance restarted successfully: ' + name);
    res.json({ message: 'WebVNC instance restarted successfully' });
  } catch (error) {
    logger.error("[WebVNCController] Failed to restart instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Delete WebVNC instance
async function deleteWebVNCInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WebVNCController] Delete instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WebVNCController] Deleting instance: ' + name + '...');
    await serviceManager.WebVNCService.deleteInstance(name);

    logger.info('[WebVNCController] Instance deleted successfully: ' + name);
    res.json({ message: 'WebVNC instance deleted successfully' });
  } catch (error) {
    logger.error("[WebVNCController] Failed to delete instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Add login user
async function addLoginUser(req, res) {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    logger.warn('[WebVNCController] Add login user failed: Missing parameters');
    return res.status(400).json({ error: 'Instance name, username, and password are required' });
  }

  try {
    logger.info("[WebVNCController] Adding login user '" + username + "' to instance: " + name + '...');
    const changeToken = utils.generateRandomString(32);
    await storageManager.RemoteVNC.addLoginUser(name, username, password, changeToken);
    await serviceManager.WebVNCService.recreateInstance(name);

    logger.info("[WebVNCController] Login user '" + username + "' added successfully to instance: " + name);
    res.json({ message: 'Login user added successfully' });
  } catch (error) {
    logger.error("[WebVNCController] Failed to add login user '" + username + "' to instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Remove login user
async function removeLoginUser(req, res) {
  const { name, username } = req.body;

  if (!name || !username) {
    logger.warn('[WebVNCController] Remove login user failed: Missing parameters');
    return res.status(400).json({ error: 'Instance name and username are required' });
  }

  try {
    logger.info("[WebVNCController] Removing login user '" + username + "' from instance: " + name + '...');
    await storageManager.RemoteVNC.removeLoginUser(name, username);
    await serviceManager.WebVNCService.recreateInstance(name);

    logger.info("[WebVNCController] Login user '" + username + "' removed successfully from instance: " + name);
    res.json({ message: 'Login user removed successfully' });
  } catch (error) {
    logger.error("[WebVNCController] Failed to remove login user '" + username + "' from instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Add VNC device
async function addVncDevice(req, res) {
  const { name, device } = req.body;

  if (!name || !device) {
    logger.warn('[WebVNCController] Add VNC device failed: Missing parameters');
    return res.status(400).json({ error: 'Instance name and device are required' });
  }

  if (!device.name || !device.ip || !device.port) {
    logger.warn('[WebVNCController] Add VNC device failed: Invalid device format -> ' + JSON.stringify(device));
    return res.status(400).json({ error: 'Device must have name, ip, and port' });
  }

  device.path = utils.sanitizeServiceName(device.name);

  try {
    logger.info("[WebVNCController] Adding VNC device '" + device.name + "' to instance: " + name + '...');
    await storageManager.RemoteVNC.addVncDevice(name, device);
    await serviceManager.WebVNCService.recreateInstance(name);

    logger.info("[WebVNCController] VNC device '" + device.name + "' added successfully to instance: " + name);
    res.json({ message: 'VNC device added successfully' });
  } catch (error) {
    logger.error("[WebVNCController] Failed to add VNC device '" + device.name + "' to instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Remove VNC device
async function removeVncDevice(req, res) {
  const { name, deviceName } = req.body;

  if (!name || !deviceName) {
    logger.warn('[WebVNCController] Remove VNC device failed: Missing parameters');
    return res.status(400).json({ error: 'Instance name and device name are required' });
  }

  try {
    logger.info("[WebVNCController] Removing VNC device '" + deviceName + "' from instance: " + name + '...');
    await storageManager.RemoteVNC.removeVncDevice(name, deviceName);
    await serviceManager.WebVNCService.recreateInstance(name);

    logger.info("[WebVNCController] VNC device '" + deviceName + "' removed successfully from instance: " + name);
    res.json({ message: 'VNC device removed successfully' });
  } catch (error) {
    logger.error("[WebVNCController] Failed to remove VNC device '" + deviceName + "' from instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Change VNC password (for third-party requests)
async function changeVncPassword(req, res) {
  const { instance, username, changeToken } = req.query;
  const { oldPassword, newPassword } = req.body;

  if (!instance || !username || !oldPassword || !newPassword || !changeToken) {
    logger.warn('[WebVNCController] Change VNC password failed: Missing parameters');
    return res.status(400).json({ error: 'Instance, username, oldPassword, changeToken and new password are required' });
  }

  try {
    logger.info("[WebVNCController] Changing VNC password for user '" + username + "' in instance: " + instance + '...');

    const [isStrong, message] = utils.checkPasswordStrength(newPassword);
    if (!isStrong) {
      logger.warn("[WebVNCController] Change VNC password failed: Weak new password for user '" + username + "' in instance: " + instance + ' -> ' + message);
      return res.status(400).json({ error: 'Weak new password: ' + message });
    }

    if ((await storageManager.RemoteVNC.validateLoginUser(instance, username, oldPassword)) === false) {
      logger.warn("[WebVNCController] Change VNC password failed: Invalid old password for user '" + username + "' in instance: " + instance);
      return res.status(400).json({ error: 'Invalid old password' });
    }

    await storageManager.RemoteVNC.changeLoginUserPasswordByToken(instance, username, newPassword, changeToken);

    logger.info("[WebVNCController] VNC password changed successfully for user '" + username + "' in instance: " + instance);
    res.json({ message: 'VNC password changed successfully' });
  } catch (error) {
    logger.error("[WebVNCController] Failed to change VNC password for user '" + username + "' in instance '" + instance + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createWebVNCInstance,
  startWebVNCInstance,
  stopWebVNCInstance,
  restartWebVNCInstance,
  deleteWebVNCInstance,
  addLoginUser,
  removeLoginUser,
  addVncDevice,
  removeVncDevice,
  changeVncPassword,
};
