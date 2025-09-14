const express = require('express');
const webvncController = require('../controllers/webvncController');
const { authenticateToken } = require('../controllers/authController');

const router = express.Router();

// Instance management
router.post('/create', authenticateToken, webvncController.createWebVNCInstance);
router.post('/start', authenticateToken, webvncController.startWebVNCInstance);
router.post('/stop', authenticateToken, webvncController.stopWebVNCInstance);
router.post('/restart', authenticateToken, webvncController.restartWebVNCInstance);
router.post('/delete', authenticateToken, webvncController.deleteWebVNCInstance);
router.post('/recreate', authenticateToken, webvncController.recreateWebVNCInstance);

// User management
router.post('/users/add', authenticateToken, webvncController.addLoginUser);
router.post('/users/remove', authenticateToken, webvncController.removeLoginUser);

// VNC device management
router.post('/devices/add', authenticateToken, webvncController.addVncDevice);
router.post('/devices/remove', authenticateToken, webvncController.removeVncDevice);

// Third-party password change request
router.post('/users/changePassword', webvncController.changeVncPassword);

module.exports = router;
