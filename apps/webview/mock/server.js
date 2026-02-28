const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock data
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin',
    role: 'admin'
  },
  {
    id: 2,
    username: 'user',
    password: 'password',
    role: 'user'
  }
];

// Store active tokens (in production, use Redis or similar)
const activeSessions = new Map();

// Helper function to generate mock token
const generateToken = (userId) => {
  return `mock_token_${userId}_${Date.now()}`;
};

// Helper function to verify token
const verifyToken = (token) => {
  return activeSessions.get(token);
};

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const userId = verifyToken(token);

  if (!userId) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const user = mockUsers.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  req.user = { id: user.id, username: user.username, email: user.email, role: user.role };
  next();
};

// Routes

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const user = mockUsers.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user.id);
  activeSessions.set(token, user.id);

  res.status(201).json({
    access_token: token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

// GET /api/auth/profile
app.get('/api/auth/profile', authenticate, (req, res) => {
  res.json({
    user: req.user
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', authenticate, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.substring(7);
  activeSessions.delete(token);

  res.json({ message: 'Logged out successfully' });
});

// GET /api/config
app.get('/api/config', (req, res) => {
  res.json({
    features: {
      passwordChange: true,
    },
    version: '1.0.0',
    environment: 'mock'
  });
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: {
      users: mockUsers.length,
      wireguard: {
        'status': 'connected',
        'details': 'This is a mock'
      }
    }
  });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock backend server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/auth/profile (authenticated)');
  console.log('  POST   /api/auth/logout (authenticated)');
  console.log('  GET    /api/config');
  console.log('  GET    /api/health');
  console.log('\nMock credentials:');
  console.log('  Username: admin, Password: admin');
  console.log('  Username: user, Password: password');
});
