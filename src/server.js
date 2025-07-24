const express = require('express');
const Docker = require('dockerode');
const storageManager = require('./storageManager');
const certificateManager = require('./certificateManager');
const webProxyManager = require('./webProxyManager');
const utils = require('./utils');

// Required environment variables
const requiredEnvVars = [
  'ROOT_DOMAIN',
  'INIT_USERNAME', 
  'INIT_PASSWORD',
  'CERTBOT_EMAIL'
];

// Check required environment variables
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;
const app = express();
const PORT = process.env.PORT || 3000;
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

app.use(express.static('public'));
app.use(express.json());

// Test Docker connection
async function testDockerConnection() {
  try {
    await docker.info();
    console.log('✅ Docker connection successful');
    return true;
  } catch (error) {
    console.error('❌ Docker connection failed:', error.message);
    process.exit(1);
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

// Get all instances
app.get('/instances', async (req, res) => {
  try {
    const state = storageManager.loadState();
    const instancesWithStatus = {};
    
    for (const [name, instance] of Object.entries(state.instances)) {
      const containerName = `wg-easy-${utils.sanitizeServiceName(name)}`;
      const isRunning = await utils.checkContainerStatus(docker, containerName);
      
      instancesWithStatus[name] = {
        ...instance,
        status: isRunning ? 'online' : 'offline',
        subdomain: `${name}.${ROOT_DOMAIN}`
      };
    }
    
    res.json(instancesWithStatus);
  } catch (error) {
    console.error('❌ Error reading instances:', error.message);
    res.status(500).json({ error: 'Failed to read instances' });
  }
});

// Create new instance
app.post('/create', async (req, res) => {
  const name = req.body.name;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).send('Invalid instance name');
  }
  
  console.log(`🔧 Creating instance: ${name}`);
  
  try {
    // Allocate instance in state
    const instanceData = storageManager.allocate(name);
    console.log(`📋 Instance allocated: ${name}`);
    
    // Create subdomain certificate
    const subdomain = `${name}.${ROOT_DOMAIN}`;
    await certificateManager.createCertificate(subdomain);
    console.log(`🔒 Certificate created for: ${subdomain}`);
    
    // Create and start container
    await createAndStartContainer(name, instanceData);
    console.log(`🐳 Container created: ${name}`);
    
    // Update nginx configuration
    await webProxyManager.addSite(name, instanceData.ipv4, instanceData.webPort);
    console.log(`🌐 Nginx updated for: ${subdomain}`);
    
    res.json({ 
      message: 'Instance created successfully',
      subdomain: subdomain
    });
  } catch (error) {
    console.error(`❌ Create instance error: ${error.message}`);
    storageManager.free(name);
    res.status(500).send(error.message);
  }
});

// Delete instance
app.post('/delete', async (req, res) => {
  const name = req.body.name;
  
  if (!name) {
    return res.status(400).send('Invalid instance name');
  }
  
  console.log(`🗑️ Deleting instance: ${name}`);
  
  try {
    const containerName = `wg-easy-${utils.sanitizeServiceName(name)}`;
    
    // Stop and remove container
    await utils.removeContainer(docker, containerName);
    
    // Remove nginx site
    await webProxyManager.removeSite(name);
    
    // Free instance from state
    storageManager.free(name);
    
    console.log(`✅ Instance deleted: ${name}`);
    res.send('Instance deleted successfully');
  } catch (error) {
    console.error(`❌ Delete error: ${error.message}`);
    res.status(500).send(error.message);
  }
});

async function createAndStartContainer(name, instanceData) {
  const sanitizedName = utils.sanitizeServiceName(name);
  const containerName = `wg-easy-${sanitizedName}`;
  
  const container = await docker.createContainer({
    Image: 'ghcr.io/wg-easy/wg-easy:15',
    name: containerName,
    NetworkingConfig: {
      EndpointsConfig: {
        wgnet: {
          IPAMConfig: {
            IPv4Address: instanceData.ipv4
          }
        }
      }
    },
    ExposedPorts: {
      '51820/udp': {},
    },
    HostConfig: {
      PortBindings: {
        '51820/udp': [{ HostPort: instanceData.udpPort.toString() }],
      },
      Binds: ['/lib/modules:/lib/modules:ro'],
      CapAdd: ['NET_ADMIN', 'SYS_MODULE'],
      RestartPolicy: { Name: 'unless-stopped' }
    },
    Env: [
      'INIT_ENABLED=true',
      `INIT_USERNAME=${process.env.INIT_USERNAME}`,
      `INIT_PASSWORD=${process.env.INIT_PASSWORD}`,
      `INIT_HOST=${ROOT_DOMAIN}`,
      'INIT_PORT=51820',
      'INIT_DNS=1.1.1.1,8.8.8.8',
      'INIT_IPV4_CIDR=172.21.0.0/24',
      'INIT_IPV6_CIDR=fd00:172:21::/64',
      'DISABLE_IPV6=true',
      'PORT=51821',
      'HOST=0.0.0.0',
      'INSECURE=false'
    ]
  });
  
  await container.start();
}

// Start server
async function startServer() {
  await testDockerConnection();
  await certificateManager.renewExistingCertificates();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Root domain: ${ROOT_DOMAIN}`);
  });
}

startServer().catch(console.error);