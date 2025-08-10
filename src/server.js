const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cron = require('node-cron');
const Docker = require('dockerode');
const storageManager = require('./storageManager');
const certificateManager = require('./certificateManager');
const containerManager = require('./containerManager');
const utils = require('./utils');

// Required environment variables
const requiredEnvVars = [
  'ROOT_DOMAIN',
  'INIT_USERNAME', 
  'INIT_PASSWORD',
  'CERTBOT_EMAIL',
  'JWT_SECRET'
];

// Check required environment variables
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;
const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
const PORT = process.env.PORT || 3000;
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

app.use(express.static('public'));
app.use(express.json());

// Initialize default user
function initializeDefaultUser() {
  const existingUser = storageManager.getUser(process.env.INIT_USERNAME);
  if (!existingUser) {
    storageManager.createUser(process.env.INIT_USERNAME, process.env.INIT_PASSWORD);
    console.log(`✅ Default user created: ${process.env.INIT_USERNAME}`);
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Login endpoint
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  try {
    const isValid = storageManager.validateUser(username, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Change password endpoint
app.post('/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const username = req.user.username;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password required' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }
  
  try {
    const isValidCurrent = storageManager.validateUser(username, currentPassword);
    if (!isValidCurrent) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    storageManager.updateUserPassword(username, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

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

// Docker status endpoint (protected)
app.get('/docker/status', authenticateToken, async (req, res) => {
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

// Get all instances (protected)
app.get('/instances', authenticateToken, async (req, res) => {
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

// Create new instance (protected)
app.post('/create', authenticateToken, async (req, res) => {
  const { name, username, password, ipv4Cidr } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid instance name' });
  }
  
  try {
    const options = {};
    if (username) options.username = username;
    if (password) options.password = password;
    if (ipv4Cidr) options.ipv4Cidr = ipv4Cidr;
    
    const result = await containerManager.createInstance(name, options);
    res.json(result);
  } catch (error) {
    console.error(`❌ Create instance error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Start instance (protected)
app.post('/start', authenticateToken, async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Invalid instance name' });
  }
  
  try {
    await containerManager.startContainer(name);
    res.json({ message: 'Instance started successfully' });
  } catch (error) {
    console.error(`❌ Start error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Stop instance (protected)
app.post('/stop', authenticateToken, async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Invalid instance name' });
  }
  
  try {
    await containerManager.stopContainer(name);
    res.json({ message: 'Instance stopped successfully' });
  } catch (error) {
    console.error(`❌ Stop error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Restart instance (protected)
app.post('/restart', authenticateToken, async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Invalid instance name' });
  }
  
  try {
    await containerManager.restartContainer(name);
    res.json({ message: 'Instance restarted successfully' });
  } catch (error) {
    console.error(`❌ Restart error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Delete instance (protected)
app.post('/delete', authenticateToken, async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Invalid instance name' });
  }
  
  try {
    await containerManager.deleteInstance(name);
    res.json({ message: 'Instance deleted successfully' });
  } catch (error) {
    console.error(`❌ Delete error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get("*", (req, res) => {
  // Redirect all requests to the root path "/"
  res.redirect(301, "/");
});

// Schedule certificate renewal every week (Sundays at 2 AM)
cron.schedule('0 2 * * 0', async () => {
  console.log('🕐 Running weekly certificate renewal...');
  try {
    await certificateManager.renewExistingCertificates();
    console.log('✅ Weekly certificate renewal completed');
  } catch (error) {
    console.error('❌ Weekly certificate renewal failed:', error.message);
  }
});

// Start server
async function startServer() {
  await testDockerConnection();
  initializeDefaultUser();
  
  // Run certificate renewal on startup
  try {
    await certificateManager.renewExistingCertificates();
    console.log('✅ Startup certificate renewal completed');
  } catch (error) {
    console.error('❌ Startup certificate renewal failed:', error.message);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Root domain: ${ROOT_DOMAIN}`);
    console.log(`📅 Certificate renewal scheduled: Every Sunday at 2 AM`);
  });
}

startServer().catch(console.error);