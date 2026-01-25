const express = require('express');
const dockerController = require('../controllers/dockerController');
const { authenticateToken } = require('../controllers/authController');

const router = express.Router();

router.get('/status', authenticateToken, dockerController.getDockerStatus);
router.post('/reload-nginx', authenticateToken, dockerController.reloadNginx);

module.exports = router;
