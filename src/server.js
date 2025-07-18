const express = require('express');
const fs = require('fs');
const path = require('path');
const Docker = require('dockerode');

// Load environment variables from .env file
require('dotenv').config();

const template = require('./template');
const state = require('./stateManager');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Docker connection for local socket
function initializeDocker() {
  console.log('🐳 Initializing Docker connection...');
  console.log(`📅 Current Date/Time: 2025-07-17 13:22:19 UTC`);
  console.log(`👤 User: Aranyalma2`);
  
  // Use local Docker socket - app runs inside container with mounted socket
  const socketPath = '/var/run/docker.sock';
  console.log(`🔌 Connecting to Docker socket: ${socketPath}`);
  
  return new Docker({ socketPath });
}

const docker = initializeDocker();

app.use(express.static('public'));
app.use(express.json());

const DEPLOY_DIR = path.join(__dirname, 'deployments');

// Ensure deployment directory exists
if (!fs.existsSync(DEPLOY_DIR)) {
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });
  console.log(`📁 Created deployment directory: ${DEPLOY_DIR}`);
}

// Test Docker connection on startup
async function testDockerConnection() {
  try {
    const info = await docker.info();
    console.log('✅ Docker connection successful');
    console.log(`   Docker version: ${info.ServerVersion}`);
    console.log(`   Docker OS: ${info.OperatingSystem}`);
    console.log(`   Containers: ${info.Containers} running: ${info.ContainersRunning}`);
    return true;
  } catch (error) {
    console.error('❌ Docker connection failed:', error.message);
    console.error('💡 Please ensure Docker socket is mounted: /var/run/docker.sock');
    return false;
  }
}

// Function to check if a Docker container is running using Docker API
async function checkContainerStatus(containerName) {
  try {
    const containers = await docker.listContainers({ all: true });
    const container = containers.find(c => 
      c.Names.some(name => name === `/${containerName}`)
    );
    
    return container ? container.State === 'running' : false;
  } catch (error) {
    console.error(`Error checking container status for ${containerName}:`, error.message);
    return false;
  }
}

// Function to ensure network exists
async function ensureNetwork(networkName = 'wgnet') {
  try {
    const networks = await docker.listNetworks();
    const existingNetwork = networks.find(net => net.Name === networkName);
    
    if (!existingNetwork) {
      console.log(`🌐 Creating network: ${networkName}`);
      await docker.createNetwork({
        Name: networkName,
        Driver: 'bridge',
        IPAM: {
          Config: [{
            Subnet: '172.20.0.0/24'
          }]
        }
      });
      console.log(`✅ Network created: ${networkName}`);
    } else {
      console.log(`🌐 Network already exists: ${networkName}`);
    }
    return networkName;
  } catch (error) {
    console.error('❌ Error ensuring network:', error.message);
    throw error;
  }
}

// Function to create and start container using Docker API
async function createAndStartContainer(name, composeContent) {
  try {
    const sanitizedName = template.sanitizeServiceName(name);
    const containerName = `wg-easy-${sanitizedName}`;
    
    console.log(`🚀 Creating container: ${containerName}`);
    
    // Ensure network exists
    await ensureNetwork('wgnet');
    
    // Parse the compose file to extract container configuration
    const lines = composeContent.split('\n');
    let networkName = 'wgnet';
    let ipv4Address = '';
    let udpPort = '';
    let tcpPort = '';
    let volumeName = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('ipv4_address:')) {
        ipv4Address = line.split(':')[1].trim();
      }
      if (line.includes(':51820/udp')) {
        udpPort = line.split('"')[1].split(':')[0];
      }
      if (line.includes(':51821/tcp')) {
        tcpPort = line.split('"')[1].split(':')[0];
      }
      if (line.includes('etc_wireguard_')) {
        volumeName = line.split(':')[0].trim().replace('- ', '');
      }
    }

    console.log(`   Volume: ${volumeName}`);
    console.log(`   IP: ${ipv4Address}`);
    console.log(`   Ports: UDP ${udpPort}, TCP ${tcpPort}`);

    // Create volume first
    try {
      await docker.createVolume({ Name: volumeName });
      console.log(`📦 Created volume: ${volumeName}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`📦 Volume already exists: ${volumeName}`);
      } else {
        console.warn('⚠️  Volume creation warning:', error.message);
      }
    }

    // Create container
    const container = await docker.createContainer({
      Image: 'ghcr.io/wg-easy/wg-easy:15',
      name: containerName,
      ExposedPorts: {
        '51820/udp': {},
        '51821/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '51820/udp': [{ HostPort: udpPort }],
          '51821/tcp': [{ HostPort: tcpPort }]
        },
        Binds: [
          `${volumeName}:/etc/wireguard`,
          '/lib/modules:/lib/modules:ro'
        ],
        CapAdd: ['NET_ADMIN', 'SYS_MODULE'],
        RestartPolicy: { Name: 'unless-stopped' },
        Sysctls: {
          'net.ipv4.ip_forward': '1',
          'net.ipv4.conf.all.src_valid_mark': '1'
        }
      },
      Env: [
        'INIT_ENABLED=true',
        `INIT_USERNAME=${process.env.INIT_USERNAME || 'admin'}`,
        `INIT_PASSWORD=${process.env.INIT_PASSWORD || 'password'}`,
        `INIT_HOST=${process.env.INIT_HOST || 'localhost'}`,
        'INIT_PORT=51820',
        'INIT_DNS=1.1.1.1,8.8.8.8',
        'INIT_IPV4_CIDR=172.20.0.0/24',
        'INIT_IPV6_CIDR=fd00:172:20::/64',
        'DISABLE_IPV6=true',
        'PORT=51821',
        'HOST=0.0.0.0',
        `INSECURE=${process.env.INSECURE || 'false'}`
      ],
      NetworkingConfig: {
        EndpointsConfig: {
          [networkName]: {
            IPAMConfig: {
              IPv4Address: ipv4Address
            }
          }
        }
      }
    });

    // Start the container
    await container.start();
    console.log(`✅ Container started: ${containerName}`);
    return true;
  } catch (error) {
    console.error('❌ Error creating/starting container:', error.message);
    throw error;
  }
}

// Function to restart container using Docker API
async function restartContainer(name) {
  try {
    const sanitizedName = template.sanitizeServiceName(name);
    const containerName = `wg-easy-${sanitizedName}`;
    
    console.log(`🔄 Restarting container: ${containerName}`);
    
    // Check if container exists
    const containers = await docker.listContainers({ all: true });
    const containerInfo = containers.find(c => 
      c.Names.some(cName => cName === `/${containerName}`)
    );
    
    if (!containerInfo) {
      // Container doesn't exist, try to recreate it
      console.log(`📝 Container ${containerName} doesn't exist, attempting to recreate...`);
      
      // Get instance data to recreate container
      const currentState = state.loadState();
      const instance = currentState.instances[name];
      
      if (!instance) {
        throw new Error('Instance not found in state');
      }
      
      const yml = template.generateComposeFile(name, instance.index);
      await createAndStartContainer(name, yml);
      return true;
    }
    
    const container = docker.getContainer(containerName);
    
    // Restart the container
    await container.restart();
    console.log(`✅ Container restarted: ${containerName}`);
    return true;
  } catch (error) {
    console.error('❌ Error restarting container:', error.message);
    throw error;
  }
}

// Function to stop and remove container using Docker API
async function stopAndRemoveContainer(name) {
  try {
    const sanitizedName = template.sanitizeServiceName(name);
    const containerName = `wg-easy-${sanitizedName}`;
    
    console.log(`🛑 Stopping container: ${containerName}`);
    
    // Check if container exists first
    const containers = await docker.listContainers({ all: true });
    const containerInfo = containers.find(c => 
      c.Names.some(cName => cName === `/${containerName}`)
    );
    
    if (containerInfo) {
      const container = docker.getContainer(containerName);
      
      // Stop container
      try {
        await container.stop({ t: 10 }); // 10 second timeout
        console.log(`⏹️  Container stopped: ${containerName}`);
      } catch (error) {
        if (error.statusCode === 304) {
          console.log(`⏹️  Container already stopped: ${containerName}`);
        } else {
          console.warn('⚠️  Container stop warning:', error.message);
        }
      }
      
      // Remove container
      try {
        await container.remove();
        console.log(`🗑️  Container removed: ${containerName}`);
      } catch (error) {
        console.warn('⚠️  Container removal warning:', error.message);
      }
    } else {
      console.log(`⚠️  Container ${containerName} not found, proceeding with cleanup`);
    }
    
    // Remove volume
    const volumeName = `etc_wireguard_${sanitizedName}`;
    try {
      const volume = docker.getVolume(volumeName);
      await volume.remove();
      console.log(`📦 Volume removed: ${volumeName}`);
    } catch (error) {
      console.warn('⚠️  Volume removal warning:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error stopping/removing container:', error.message);
    throw error;
  }
}

// Function to cleanup deployment files and state
async function cleanupInstance(name) {
  try {
    console.log(`🧹 Cleaning up instance files and state: ${name}`);
    
    // Remove from state
    state.free(name);
    console.log(`📋 Removed instance from state: ${name}`);
    
    // Remove deployment directory
    const dir = path.join(DEPLOY_DIR, name);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`📁 Removed deployment directory: ${dir}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error cleaning up instance:', error.message);
    throw error;
  }
}

// Add endpoint to test Docker connection
app.get('/docker/status', async (req, res) => {
  try {
    const info = await docker.info();
    res.json({
      connected: true,
      version: info.ServerVersion,
      os: info.OperatingSystem,
      containers: info.Containers,
      containersRunning: info.ContainersRunning,
      images: info.Images
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

// Enhanced endpoint to get current instances with status
app.get('/instances', async (req, res) => {
  try {
    const currentState = state.loadState();
    const instancesWithStatus = {};
    
    // Check status for each instance
    for (const [name, instance] of Object.entries(currentState.instances)) {
      const sanitizedName = template.sanitizeServiceName(name);
      const containerName = `wg-easy-${sanitizedName}`;
      const isRunning = await checkContainerStatus(containerName);
      
      instancesWithStatus[name] = {
        ...instance,
        status: isRunning ? 'online' : 'offline'
      };
    }
    
    res.json(instancesWithStatus);
  } catch (error) {
    console.error('❌ Error reading instances:', error.message);
    res.status(500).json({ error: 'Failed to read instances' });
  }
});

app.post('/create', async (req, res) => {
  const name = req.body.name;
  
  // Validate instance name
  if (!name || typeof name !== 'string') {
    return res.status(400).send('Invalid instance name');
  }
  
  console.log(`🔧 Creating new instance: ${name} (User: Aranyalma2, Time: 2025-07-17 13:22:19 UTC)`);
  
  let instanceAllocated = false;
  let instanceData = null;
  
  try {
    // First allocate the instance in state
    instanceData = state.allocate(name);
    instanceAllocated = true;
    console.log(`📋 Instance allocated in state: ${name} (index: ${instanceData.index})`);
    
    const yml = template.generateComposeFile(name, instanceData.index);

    // Create deployment directory and compose file
    const dir = path.join(DEPLOY_DIR, name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'docker-compose.yml'), yml);
    console.log(`📁 Docker compose file created: ${dir}/docker-compose.yml`);

    try {
      // Use Docker API to create and start container
      await createAndStartContainer(name, yml);
      console.log(`✅ Instance created and started successfully: ${name}`);
      res.send('Deployment started');
    } catch (containerError) {
      console.error(`❌ Container creation failed for ${name}:`, containerError.message);
      console.log(`📝 Instance ${name} is saved in state but container failed to start`);
      console.log(`💡 You can try to manually restart the container or delete the instance`);
      
      // Don't remove from state - let it stay as "offline"
      res.status(500).send(`Container creation failed: ${containerError.message}. Instance saved but offline.`);
    }
  } catch (e) {
    console.error(`❌ Create instance error for ${name}:`, e.message);
    
    // Only clean up state if we allocated it and it was a non-container error
    if (instanceAllocated && !e.message.includes('Container') && !e.message.includes('container')) {
      try {
        state.free(name);
        console.log(`🧹 Cleaned up state for failed instance: ${name}`);
      } catch (cleanupError) {
        console.error('❌ Error cleaning up state:', cleanupError.message);
      }
    }
    
    res.status(400).send(e.message);
  }
});

app.post('/restart', async (req, res) => {
  const name = req.body.name;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).send('Invalid instance name');
  }
  
  console.log(`🔄 Restarting instance: ${name} (User: Aranyalma2, Time: 2025-07-17 13:22:19 UTC)`);
  
  try {
    await restartContainer(name);
    console.log(`✅ Instance restarted successfully: ${name}`);
    res.send('Instance restarted successfully');
  } catch (error) {
    console.error(`❌ Error restarting instance ${name}:`, error.message);
    res.status(500).send(`Failed to restart instance: ${error.message}`);
  }
});

app.post('/delete', async (req, res) => {
  const name = req.body.name;
  
  console.log(`🗑️  Deleting instance: ${name} (User: Aranyalma2, Time: 2025-07-17 13:22:19 UTC)`);

  try {
    // Always try to stop and remove container first (even if it doesn't exist)
    await stopAndRemoveContainer(name);
    
    // Always cleanup files and state (this ensures deletion works even if container doesn't exist)
    await cleanupInstance(name);
    
    console.log(`✅ Instance deleted successfully: ${name}`);
    res.send('Deployment deleted');
  } catch (error) {
    console.error(`❌ Error deleting instance ${name}:`, error.message);
    
    // Even if container deletion fails, try to cleanup files and state
    try {
      await cleanupInstance(name);
      console.log(`⚠️  Instance ${name} partially cleaned up (files and state removed)`);
      res.send('Instance deleted (files cleaned up, container may need manual removal)');
    } catch (cleanupError) {
      console.error(`❌ Error in cleanup for ${name}:`, cleanupError.message);
      res.status(500).send(`Failed to delete instance: ${error.message}`);
    }
  }
});

// Start server and test Docker connection
app.listen(PORT, async () => {
  console.log('🚀 WireGuard Instance Manager Starting...');
  console.log('=' .repeat(50));
  console.log(`📅 Current Date/Time: 2025-07-17 13:22:19 UTC`);
  console.log(`👤 User: Aranyalma2`);
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`📁 Deployment directory: ${DEPLOY_DIR}`);
  console.log('=' .repeat(50));
  
  const dockerConnected = await testDockerConnection();
  if (!dockerConnected) {
    console.log('\n📋 Docker Setup Requirements:');
    console.log('=' .repeat(50));
    console.log('This container needs Docker socket access:');
    console.log('- Mount: /var/run/docker.sock:/var/run/docker.sock');
    console.log('- Ensure Docker daemon is running on host');
    console.log('=' .repeat(50));
  }
  
  console.log(`\n🌐 Access points:`);
  console.log(`   Application: http://localhost:${PORT}`);
  console.log(`   Docker Status: http://localhost:${PORT}/docker/status`);
  console.log(`   Theme: Light/Dark toggle available`);
  console.log('\n⚡ Ready to manage WireGuard instances!');
});