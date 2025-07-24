const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, 'database', 'db.json');

function loadState() {
  try {
    if (!fs.existsSync(statePath)) {
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

function allocate(name) {
  const state = loadState();
  if (state.instances[name]) throw new Error('Instance already exists');

  let index;
  if (state.availableIndices.length > 0) {
    index = state.availableIndices.shift();
  } else {
    index = Object.keys(state.instances).length;
  }

  const ipv4 = `172.20.1.${index}`;
  const udpPort = 51820 + index;

  state.instances[name] = { 
    index, 
    ipv4, 
    udpPort, 
    createdAt: new Date().toISOString()
  };
  
  saveState(state);
  return state.instances[name];
}

function free(name) {
  const state = loadState();
  const entry = state.instances[name];
  if (!entry) return;

  state.availableIndices.push(entry.index);
  delete state.instances[name];
  saveState(state);
}

module.exports = {
  loadState,
  saveState,
  allocate,
  free
};