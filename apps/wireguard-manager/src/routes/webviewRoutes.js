const express = require('express');
const webviewController = require('../controllers/webviewController');
const { authenticateToken } = require('../controllers/authController');

const router = express.Router();

// Instance management
router.post('/create', authenticateToken, webviewController.createWebViewInstance);
router.post('/start', authenticateToken, webviewController.startWebViewInstance);
router.post('/stop', authenticateToken, webviewController.stopWebViewInstance);
router.post('/restart', authenticateToken, webviewController.restartWebViewInstance);
router.post('/delete', authenticateToken, webviewController.deleteWebViewInstance);
router.post('/recreate', authenticateToken, webviewController.recreateWebViewInstance);

// User management
router.post('/users/add', authenticateToken, webviewController.addLoginUser);
router.post('/users/remove', authenticateToken, webviewController.removeLoginUser);

// Third-party password change request
router.post('/users/changePassword', webviewController.changeViewPassword);

module.exports = router;
