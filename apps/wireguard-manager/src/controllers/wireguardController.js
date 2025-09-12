const storageManager = require('../modules/storageManager');
const serviceManager = require('../modules/serviceManager');
const logger = require('../modules/logger');

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

// Get all instances
async function getAllInstances(req, res) {
  try {
    const instances = await storageManager.WireguardServer.getAll();
    const instancesWithStatus = {};

    for (const [name, instance] of Object.entries(instances)) {
      const isRunning = (await serviceManager.WireguardServerService.statusInstance(name)) === 'running';

      const { username, password, remoteVNC, ...safeInstance } = instance;

      instancesWithStatus[name] = {
        ...safeInstance,
        status: isRunning ? 'online' : 'offline',
        subdomain: `${name}.${ROOT_DOMAIN}`,
      };

      if (remoteVNC) {
        const isVncRunning = (await serviceManager.WebVNCService.statusInstance(name)) === 'running';

        remoteVNC.loginUsers.forEach((element) => delete element.password);
        remoteVNC.vncDevices.forEach((element) => delete element.password);

        const { wireguard, ...safeVncInstance } = remoteVNC;

        instancesWithStatus[name].remoteVNC = {
          ...safeVncInstance,
          status: isVncRunning ? 'online' : 'offline',
          subdomain: `vnc.${name}.${ROOT_DOMAIN}`,
        };
      }
    }

    logger.silly('[WireguardController] Instances fetched successfully');
    res.json(instancesWithStatus);
  } catch (error) {
    logger.error('[WireguardController] Failed to fetch instances: ' + error.message);
    res.status(500).json({ error: 'Failed to fetch instances' });
  }
}

// Create new instance
async function createInstance(req, res) {
  const { name, username, password, ipv4Cidr } = req.body;

  if (!name || typeof name !== 'string') {
    logger.warn('[WireguardController] Create instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WireguardController] Creating instance: ' + name + '...');
    const options = {};
    if (username) options.username = username;
    if (password) options.password = password;
    if (ipv4Cidr) options.ipv4Cidr = ipv4Cidr;

    if (password && password.length < 12) {
      logger.warn('[WireguardController] Create instance failed: Password must be at least 12 characters long');
      throw new Error('Password must be at least 12 characters long');
    }

    const result = await serviceManager.WireguardServerService.createInstance(name, options);

    logger.info('[WireguardController] Instance created successfully: ' + name);
    res.json(result);
  } catch (error) {
    logger.error("[WireguardController] Failed to create instance '" + req.body.name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Start instance
async function startInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WireguardController] Start instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WireguardController] Starting instance: ' + name + '...');
    await serviceManager.WireguardServerService.startInstance(name);

    if (await storageManager.RemoteVNC.exists(name)) {
      logger.info('[WireguardController] Starting associated VNC service for: ' + name);
      await serviceManager.WebVNCService.startInstance(name);
    }

    logger.info('[WireguardController] Instance started successfully: ' + name);
    res.json({ message: 'Instance started successfully' });
  } catch (error) {
    logger.error("[WireguardController] Failed to start instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Stop instance
async function stopInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WireguardController] Stop instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WireguardController] Stopping instance: ' + name + '...');
    await serviceManager.WireguardServerService.stopInstance(name);

    if (await storageManager.RemoteVNC.exists(name)) {
      logger.info('[WireguardController] Stopping associated VNC service for: ' + name);
      await serviceManager.WebVNCService.stopInstance(name);
    }

    logger.info('[WireguardController] Instance stopped successfully: ' + name);
    res.json({ message: 'Instance stopped successfully' });
  } catch (error) {
    logger.error("[WireguardController] Failed to stop instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Restart instance
async function restartInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WireguardController] Restart instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WireguardController] Restarting instance: ' + name + '...');
    await serviceManager.WireguardServerService.restartInstance(name);

    if (await storageManager.RemoteVNC.exists(name)) {
      logger.info('[WireguardController] Restarting associated VNC service for: ' + name);
      await serviceManager.WebVNCService.restartInstance(name);
    }

    logger.info('[WireguardController] Instance restarted successfully: ' + name);
    res.json({ message: 'Instance restarted successfully' });
  } catch (error) {
    logger.error("[WireguardController] Failed to restart instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

// Delete instance
async function deleteInstance(req, res) {
  const { name } = req.body;

  if (!name) {
    logger.warn('[WireguardController] Delete instance failed: Invalid instance name');
    return res.status(400).json({ error: 'Invalid instance name' });
  }

  try {
    logger.info('[WireguardController] Deleting instance: ' + name + '...');
    await serviceManager.WireguardServerService.deleteInstance(name);

    if (await storageManager.RemoteVNC.exists(name)) {
      logger.info('[WireguardController] Deleting associated VNC service for: ' + name);
      await serviceManager.WebVNCService.deleteInstance(name);
    }

    logger.info('[WireguardController] Instance deleted successfully: ' + name);
    res.json({ message: 'Instance deleted successfully' });
  } catch (error) {
    logger.error("[WireguardController] Failed to delete instance '" + name + "': " + error.message);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllInstances,
  createInstance,
  startInstance,
  stopInstance,
  restartInstance,
  deleteInstance,
};
