const fs = require('fs').promises;
const path = require('path');

const statePath = path.join(__dirname, '../', 'database', 'db.json');

// ============================================================================
// ASYNC LOCK AND IN-MEMORY CACHE MANAGEMENT
// ============================================================================

class AsyncLock {
  constructor() {
    this.locked = false;
    this.queue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.locked = false;
    }
  }
}

// Global state cache and lock
let memoryState = null;
let isInitialized = false;
const stateLock = new AsyncLock();

async function _initializeState() {
  if (isInitialized) return;

  await stateLock.acquire();
  try {
    if (isInitialized) return; // Double-check after acquiring lock

    try {
      const data = await fs.readFile(statePath, 'utf8');
      memoryState = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create initial state
        memoryState = {
          instances: {},
          users: [], // Simple array for username/password storage
        };
        await _writeStateToFile();
      } else {
        console.error('Error reading state file:', error);
        memoryState = {
          instances: {},
          users: [],
        };
      }
    }

    isInitialized = true;
  } finally {
    stateLock.release();
  }
}

async function _writeStateToFile() {
  try {
    // Ensure directory exists
    const dir = path.dirname(statePath);
    await fs.mkdir(dir, { recursive: true });

    // Write to file
    await fs.writeFile(statePath, JSON.stringify(memoryState, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing state to file:', error);
    throw error;
  }
}

async function _readState() {
  if (!isInitialized) {
    await _initializeState();
  }

  await stateLock.acquire();
  try {
    // Return a deep copy to prevent external modifications
    return JSON.parse(JSON.stringify(memoryState));
  } finally {
    stateLock.release();
  }
}

async function _writeState(newState) {
  if (!isInitialized) {
    await _initializeState();
  }

  await stateLock.acquire();
  try {
    // Update memory state
    memoryState = JSON.parse(JSON.stringify(newState));

    // Write to file
    await _writeStateToFile();
  } finally {
    stateLock.release();
  }
}

async function _modifyState(modifier) {
  if (!isInitialized) {
    await _initializeState();
  }

  await stateLock.acquire();
  try {
    // Apply modification to memory state
    modifier(memoryState);

    // Write to file
    await _writeStateToFile();
  } finally {
    stateLock.release();
  }
}

// ============================================================================
// WIREGUARD SERVER MODULE
// ============================================================================

const WireguardServer = {
  async allocate(name, options = {}) {
    if (!name) throw new Error('Server name is required');

    await _modifyState((state) => {
      if (state.instances[name]) {
        throw new Error('WireGuard server instance already exists');
      }

      // Get the next available index
      const existingIndices = Object.values(state.instances).map((instance) => instance.index);
      const maxIndex = existingIndices.length > 0 ? Math.max(...existingIndices) : -1;
      const index = maxIndex + 1;

      const ipv4 = `172.20.1.${index + 1}`; // Start from 172.20.1.1
      const udpPort = 51820 + index;

      // WireGuard server parameters are immutable after creation
      state.instances[name] = {
        index,
        ipv4,
        udpPort,
        username: options.username || process.env.INIT_USERNAME,
        password: options.password || process.env.INIT_PASSWORD,
        ipv4Cidr: options.ipv4Cidr || '172.21.0.0/24',
        createdAt: new Date().toISOString(),
      };
    });

    return this.get(name);
  },

  async free(name) {
    await _modifyState((state) => {
      if (!state.instances[name]) return;
      delete state.instances[name];
    });
  },

  async get(name) {
    const state = await _readState();
    return state.instances[name] || null;
  },

  async getAll() {
    const state = await _readState();
    return state.instances;
  },

  async exists(name) {
    const state = await _readState();
    return !!state.instances[name];
  },
};

// ============================================================================
// REMOTE VNC MODULE
// ============================================================================

const RemoteVNC = {
  async initialize(instanceName, wireguardConfig, loginUsers = [], vncDevices = []) {
    await _modifyState((state) => {
      if (!state.instances[instanceName]) {
        throw new Error('WireGuard server instance not found');
      }

      if (state.instances[instanceName].remoteVNC) {
        throw new Error('RemoteVNC module already initialized for this WireGuard server');
      }

      // Use the same index as the WireGuard server but with 172.20.2.X range
      const index = state.instances[instanceName].index;
      const vncIpv4 = `172.20.2.${index + 1}`;

      state.instances[instanceName].remoteVNC = {
        ipv4: vncIpv4,
        wireguard: {
          config: wireguardConfig || '',
        },
        loginUsers: loginUsers, // Array of {username, password} objects for the entire remoteVNC instance
        vncDevices: vncDevices, // Array of {name, ip, port, password, path} objects
        updatedAt: new Date().toISOString(),
      };
    });

    return this.get(instanceName);
  },

  async remove(instanceName) {
    await _modifyState((state) => {
      if (!state.instances[instanceName]) {
        throw new Error('WireGuard server instance not found');
      }

      if (state.instances[instanceName].remoteVNC) {
        delete state.instances[instanceName].remoteVNC;
      }
    });
  },

  async exists(instanceName) {
    const state = await _readState();
    return !!(state.instances[instanceName] && state.instances[instanceName].remoteVNC);
  },

  async get(instanceName) {
    const state = await _readState();
    if (!state.instances[instanceName]) {
      throw new Error('WireGuard server instance not found');
    }
    return state.instances[instanceName].remoteVNC || null;
  },

  async updateWireguard(instanceName, config) {
    await _modifyState((state) => {
      if (!state.instances[instanceName]) {
        throw new Error('WireGuard server instance not found');
      }

      if (!state.instances[instanceName].remoteVNC) {
        throw new Error('RemoteVNC module not initialized');
      }

      state.instances[instanceName].remoteVNC.wireguard.config = config;
      state.instances[instanceName].remoteVNC.updatedAt = new Date().toISOString();
    });
  },

  async addVncDevice(instanceName, device) {
    // Validate device object has required fields
    if (!device.name || !device.ip || !device.port || !device.path) {
      throw new Error('VNC device must have name, ip, port, and path');
    }

    await _modifyState((state) => {
      if (!state.instances[instanceName]) {
        throw new Error('WireGuard server instance not found');
      }

      if (!state.instances[instanceName].remoteVNC) {
        throw new Error('RemoteVNC module not initialized');
      }

      // Check if device with same name already exists
      const existingDevice = state.instances[instanceName].remoteVNC.vncDevices.find((d) => d.name === device.name);
      if (existingDevice) {
        throw new Error('VNC device with this name already exists');
      }

      state.instances[instanceName].remoteVNC.vncDevices.push({
        name: device.name,
        ip: device.ip,
        port: device.port,
        password: device.password || '',
        path: device.path,
      });

      state.instances[instanceName].remoteVNC.updatedAt = new Date().toISOString();
    });
  },

  async removeVncDevice(instanceName, deviceName) {
    await _modifyState((state) => {
      if (!state.instances[instanceName]) {
        throw new Error('WireGuard server instance not found');
      }

      if (!state.instances[instanceName].remoteVNC) {
        throw new Error('RemoteVNC module not initialized');
      }

      const deviceIndex = state.instances[instanceName].remoteVNC.vncDevices.findIndex((d) => d.name === deviceName);
      if (deviceIndex === -1) {
        throw new Error('VNC device not found');
      }

      state.instances[instanceName].remoteVNC.vncDevices.splice(deviceIndex, 1);
      state.instances[instanceName].remoteVNC.updatedAt = new Date().toISOString();
    });
  },

  async updateVncDevice(instanceName, deviceName, updates) {
    await _modifyState((state) => {
      if (!state.instances[instanceName]) {
        throw new Error('WireGuard server instance not found');
      }

      if (!state.instances[instanceName].remoteVNC) {
        throw new Error('RemoteVNC module not initialized');
      }

      const device = state.instances[instanceName].remoteVNC.vncDevices.find((d) => d.name === deviceName);
      if (!device) {
        throw new Error('VNC device not found');
      }

      // Update allowed fields
      if (updates.ip) device.ip = updates.ip;
      if (updates.port) device.port = updates.port;
      if (updates.password !== undefined) device.password = updates.password;
      if (updates.path) device.path = updates.path;

      state.instances[instanceName].remoteVNC.updatedAt = new Date().toISOString();
    });
  },

  async addLoginUser(instanceName, username, password) {
    await _modifyState((state) => {
      if (!state.instances[instanceName]) {
        throw new Error('WireGuard server instance not found');
      }

      if (!state.instances[instanceName].remoteVNC) {
        throw new Error('RemoteVNC module not initialized');
      }

      // Check if user already exists
      const existingUser = state.instances[instanceName].remoteVNC.loginUsers.find((user) => user.username === username);
      if (existingUser) {
        throw new Error('User already exists for this remoteVNC instance');
      }

      state.instances[instanceName].remoteVNC.loginUsers.push({ username, password });
      state.instances[instanceName].remoteVNC.updatedAt = new Date().toISOString();
    });
  },

  async removeLoginUser(instanceName, username) {
    await _modifyState((state) => {
      if (!state.instances[instanceName]) {
        throw new Error('WireGuard server instance not found');
      }

      if (!state.instances[instanceName].remoteVNC) {
        throw new Error('RemoteVNC module not initialized');
      }

      const userIndex = state.instances[instanceName].remoteVNC.loginUsers.findIndex((user) => user.username === username);
      if (userIndex > -1) {
        state.instances[instanceName].remoteVNC.loginUsers.splice(userIndex, 1);
        state.instances[instanceName].remoteVNC.updatedAt = new Date().toISOString();
      }
    });
  },

  async getLoginUsers(instanceName) {
    const state = await _readState();
    if (!state.instances[instanceName]) {
      throw new Error('WireGuard server instance not found');
    }

    if (!state.instances[instanceName].remoteVNC) {
      throw new Error('RemoteVNC module not initialized');
    }

    return state.instances[instanceName].remoteVNC.loginUsers;
  },

  async getVncDevices(instanceName) {
    const state = await _readState();
    if (!state.instances[instanceName]) {
      throw new Error('WireGuard server instance not found');
    }

    if (!state.instances[instanceName].remoteVNC) {
      throw new Error('RemoteVNC module not initialized');
    }

    return state.instances[instanceName].remoteVNC.vncDevices;
  },
};

// ============================================================================
// USER HANDLER MODULE (SIMPLIFIED)
// ============================================================================

const UserHandler = {
  async createUser(username, password) {
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync(password, 10);

    await _modifyState((state) => {
      if (state.users.find((user) => user.username === username)) {
        throw new Error('User already exists');
      }

      state.users.push({
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  },

  async updatePassword(username, newPassword) {
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await _modifyState((state) => {
      const user = state.users.find((user) => user.username === username);
      if (!user) {
        throw new Error('User not found');
      }

      user.password = hashedPassword;
      user.updatedAt = new Date().toISOString();
    });
  },

  async getByUsername(username) {
    const state = await _readState();
    return state.users.find((user) => user.username === username) || null;
  },

  async getAll() {
    const state = await _readState();
    return state.users;
  },

  async existsByUsername(username) {
    const state = await _readState();
    return !!state.users.find((user) => user.username === username);
  },

  async validateUser(username, password) {
    const user = await this.getByUsername(username);
    if (!user) return false;

    const bcrypt = require('bcrypt');
    return bcrypt.compareSync(password, user.password);
  },
};

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

const CacheManager = {
  async getMemoryState() {
    return await _readState();
  },

  async forceReloadFromFile() {
    await stateLock.acquire();
    try {
      const data = await fs.readFile(statePath, 'utf8');
      memoryState = JSON.parse(data);
    } catch (error) {
      console.error('Error reloading from file:', error);
      throw error;
    } finally {
      stateLock.release();
    }
  },

  async getStats() {
    const state = await _readState();
    return {
      isInitialized,
      instanceCount: Object.keys(state.instances).length,
      userCount: state.users.length,
      hasRemoteVNC: Object.values(state.instances).filter((i) => i.remoteVNC).length,
    };
  },
};

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  // Modular components
  WireguardServer,
  RemoteVNC,
  UserHandler,
  CacheManager,
};
