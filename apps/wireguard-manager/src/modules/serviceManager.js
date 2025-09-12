const { WireguardServer: WireguardServerStorage, RemoteVNC: WebVNCStorage } = require('./storageManager');
const certificateManager = require('./certificateManager');
const webProxyManager = require('./webProxyManager');
const WireguardContainer = require('./containers/wireguardServer');
const WebVNCContainer = require('./containers/webVNC');
const utils = require('./utils');
const logger = require('./logger');

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

async function initServices() {
  const instances = await WireguardServerStorage.getAll();

  for (const [name, instanceData] of Object.entries(instances)) {
    const wgContainer = new WireguardContainer(name, instanceData);
    WireguardServerService.wireguardServerInstances.set(name, wgContainer);

    if (instanceData.remoteVNC) {
      const webVNC = new WebVNCContainer(name, instanceData.remoteVNC);
      WebVNCService.vncServices.set(name, webVNC);
    }

    logger.info(`[ServiceManager] Loaded existing instance: ${name}`);
  }
}

const WireguardServerService = {
  wireguardServerInstances: new Map(),

  async createInstance(rawName, options = {}) {
    const name = utils.sanitizeServiceName(rawName);
    let instanceData = null,
      containerCreated = false,
      proxyConfigured = false;

    try {
      if (this.wireguardServerInstances.has(name)) throw new Error(`Instance already exists: ${name}`);

      logger.info(`[WireguardService] Creating instance: ${name}`);

      instanceData = await WireguardServerStorage.allocate(name, options);
      logger.info(`[WireguardService] Instance allocated: ${name}`);

      await certificateManager.createCertificate(name);
      logger.info(`[WireguardService] Certificate created for: ${name}`);

      const wgContainer = new WireguardContainer(name, instanceData);
      this.wireguardServerInstances.set(name, wgContainer);
      await wgContainer.createContainer();
      containerCreated = true;
      logger.info(`[WireguardService] Container created: ${name}`);

      await webProxyManager.addSite(name, instanceData.ipv4);
      proxyConfigured = true;
      logger.info(`[WireguardService] Nginx updated for: ${name}`);

      logger.info(`[WireguardService] Instance creation completed: ${name}`);
      return { message: 'Instance created successfully', subdomain: name };
    } catch (error) {
      logger.error(`[WireguardService] Instance creation failed for ${name}: ${error.message}`);

      try {
        if (proxyConfigured) {
          await webProxyManager.removeSite(name);
          logger.info(`[WireguardService] Reverted nginx configuration for: ${name}`);
        }
        if (containerCreated) {
          await this.wireguardServerInstances.get(name).delete();
          this.wireguardServerInstances.delete(name);
          logger.info(`[WireguardService] Reverted container creation for: ${name}`);
        }
        if (instanceData) {
          WireguardServerStorage.free(name);
          logger.info(`[WireguardService] Reverted storage allocation for: ${name}`);
        }
      } catch (revertError) {
        logger.error(`[WireguardService] Failed to revert changes for ${name}: ${revertError.message}`);
      }

      throw error;
    }
  },

  async deleteInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);

    try {
      logger.info(`[WireguardService] Deleting instance: ${name}`);

      try {
        await this.wireguardServerInstances.get(name).delete();
        this.wireguardServerInstances.delete(name);
      } catch (error) {
        logger.warn(`[WireguardService] Failed to delete docker container for ${name}: ${error.message}`);
      }

      await webProxyManager.removeSite(name);
      WireguardServerStorage.free(name);

      logger.info(`[WireguardService] Instance deleted: ${name}`);
    } catch (error) {
      logger.error(`[WireguardService] Instance deletion failed for ${name}: ${error.message}`);
      throw error;
    }
  },

  async startInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);
    if (!this.wireguardServerInstances.has(name)) throw new Error(`Instance not found: ${name}`);

    try {
      return await this.wireguardServerInstances.get(name).start();
    } catch (error) {
      if (error.reason && error.reason.includes('no such container')) {
        const instanceData = await WireguardServerStorage.get(name);
        if (!instanceData) throw new Error(`Instance data not found in storage: ${name}`);
        const wgContainer = new WireguardContainer(name, instanceData);
        this.wireguardServerInstances.set(name, wgContainer);
        return await wgContainer.createContainer();
      }
      throw error;
    }
  },

  async stopInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);
    if (!this.wireguardServerInstances.has(name)) throw new Error(`Instance not found: ${name}`);
    return this.wireguardServerInstances.get(name).stop();
  },

  async restartInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);
    if (!this.wireguardServerInstances.has(name)) throw new Error(`Instance not found: ${name}`);
    return this.wireguardServerInstances.get(name).restart();
  },

  async statusInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);
    if (!this.wireguardServerInstances.has(name)) throw new Error(`Instance not found: ${name}`);
    return this.wireguardServerInstances.get(name).getStatus();
  },

  async listInstances() {
    return Array.from(this.wireguardServerInstances.keys());
  },
};

const WebVNCService = {
  vncServices: new Map(),

  async createInstance(rawName, options = {}) {
    const name = utils.sanitizeServiceName(rawName);
    let instanceData = null,
      containerCreated = false,
      proxyConfigured = false;

    try {
      if (this.vncServices.has(name)) throw new Error(`Instance already exists: ${name}`);

      instanceData = await WebVNCStorage.initialize(name, options.wireguardConfig, options.loginUsers, options.vncDevices);
      logger.info(`[WebVNCService] VNC Instance allocated: ${name}`);

      const subdomain = `vnc.${name}`;
      await certificateManager.createCertificate(subdomain);
      logger.info(`[WebVNCService] Certificate created for: ${subdomain}`);

      const vncContainer = new WebVNCContainer(name, instanceData);
      this.vncServices.set(name, vncContainer);
      await vncContainer.createContainer();
      containerCreated = true;
      logger.info(`[WebVNCService] Container created: ${name}`);

      await webProxyManager.addSite(subdomain, instanceData.ipv4, `${subdomain}.${ROOT_DOMAIN}`);
      proxyConfigured = true;
      logger.info(`[WebVNCService] Nginx updated for: ${subdomain}`);

      logger.info(`[WebVNCService] VNC Instance creation completed: ${name}`);
      return { message: 'VNC Instance created successfully', subdomain };
    } catch (error) {
      logger.error(`[WebVNCService] VNC Instance creation failed for ${name}: ${error.message}`);

      try {
        if (proxyConfigured) {
          await webProxyManager.removeSite(subdomain);
          logger.info(`[WebVNCService] Reverted nginx configuration for: ${name}`);
        }
        if (containerCreated) {
          await this.vncServices.get(name).delete();
          this.vncServices.delete(name);
          logger.info(`[WebVNCService] Reverted container creation for: ${name}`);
        }
        if (instanceData) {
          WebVNCStorage.remove(name);
          logger.info(`[WebVNCService] Reverted storage allocation for: ${name}`);
        }
      } catch (revertError) {
        logger.error(`[WebVNCService] Failed to revert changes for ${name}: ${revertError.message}`);
      }

      throw error;
    }
  },

  async recreateInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);
    try {
      if (!this.vncServices.has(name)) throw new Error(`Instance not found: ${name}`);

      try {
        await this.vncServices.get(name).delete();
        this.vncServices.delete(name);
      } catch (error) {
        logger.warn(`[WebVNCService] Failed to delete existing docker container for ${name}: ${error.message}`);
      }

      const instanceData = await WebVNCStorage.get(name);
      if (!instanceData) throw new Error(`Instance data not found in storage: ${name}`);

      const vncContainer = new WebVNCContainer(name, instanceData);
      this.vncServices.set(name, vncContainer);
      await vncContainer.createContainer();

      logger.info(`[WebVNCService] VNC Instance recreated: ${name}`);
    } catch (error) {
      logger.error(`[WebVNCService] VNC Instance recreation failed for ${name}: ${error.message}`);
      throw error;
    }
  },

  async deleteInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);
    try {
      if (!this.vncServices.has(name)) throw new Error(`Instance not found: ${name}`);

      try {
        await this.vncServices.get(name).delete();
        this.vncServices.delete(name);
      } catch (error) {
        logger.warn(`[WebVNCService] Failed to delete docker container for ${name}: ${error.message}`);
      }

      await webProxyManager.removeSite(`vnc.${name}`);
      WebVNCStorage.remove(name);

      logger.info(`[WebVNCService] VNC Instance deleted: ${name}`);
    } catch (error) {
      logger.error(`[WebVNCService] VNC Instance deletion failed for ${name}: ${error.message}`);
      throw error;
    }
  },

  async startInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);
    if (!this.vncServices.has(name)) throw new Error(`Instance not found: ${name}`);

    try {
      return await this.vncServices.get(name).start();
    } catch (error) {
      if (error.reason && error.reason.includes('no such container')) {
        const instanceData = await WebVNCStorage.get(name);
        if (!instanceData) throw new Error(`Instance data not found in storage: ${name}`);
        const vncContainer = new WebVNCContainer(name, instanceData);
        this.vncServices.set(name, vncContainer);
        return await vncContainer.createContainer();
      }
      throw error;
    }
  },

  async stopInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);
    if (!this.vncServices.has(name)) throw new Error(`Instance not found: ${name}`);
    return this.vncServices.get(name).stop();
  },

  async restartInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);
    if (!this.vncServices.has(name)) throw new Error(`Instance not found: ${name}`);
    return this.vncServices.get(name).restart();
  },

  async statusInstance(rawName) {
    const name = utils.sanitizeServiceName(rawName);
    if (!this.vncServices.has(name)) throw new Error(`Instance not found: ${name}`);
    return this.vncServices.get(name).getStatus();
  },
};

module.exports = {
  initServices,
  WireguardServerService,
  WebVNCService,
};
