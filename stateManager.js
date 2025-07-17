const fs = require('fs');
const path = require('path');

// State file is now in the deployments directory
const DEPLOY_DIR = path.join(__dirname, 'deployments');
const statePath = path.join(DEPLOY_DIR, 'state.json');

// Ensure deployment directory exists
if (!fs.existsSync(DEPLOY_DIR)) {
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });
}

function loadState() {
  try {
    if (!fs.existsSync(statePath)) {
      // Create initial state file if it doesn't exist
      const initialState = {
        instances: {},
        availableIndices: []
      };
      saveState(initialState);
      return initialState;
    }
    return JSON.parse(fs.readFileSync(statePath));
  } catch (error) {
    console.error('Error loading state:', error);
    // Return default state if file is corrupted
    return {
      instances: {},
      availableIndices: []
    };
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving state:', error);
    throw error;
  }
}

exports.loadState = loadState;

exports.allocate = (name) => {
  const state = loadState();
  if (state.instances[name]) throw new Error('Instance already exists');

  let index;
  if (state.availableIndices.length > 0) {
    index = state.availableIndices.shift();
  } else {
    index = Object.keys(state.instances).length;
  }

  const ipv4 = `172.20.0.${10 + index}`;
  const udp_port = 51820 + index * 2;
  const tcp_port = udp_port + 1;

  state.instances[name] = { index, ipv4, udp_port, tcp_port };
  saveState(state);
  return { index, ipv4, udp_port, tcp_port };
};

exports.free = (name) => {
  const state = loadState();
  const entry = state.instances[name];
  if (!entry) return;

  state.availableIndices.push(entry.index);
  delete state.instances[name];
  saveState(state);
};