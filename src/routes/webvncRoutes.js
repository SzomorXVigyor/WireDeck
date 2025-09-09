const express = require("express");
const webvncController = require("../controllers/webvncController");
const { authenticateToken } = require("../controllers/authController");

const router = express.Router();

// Instance management
router.get("/instance/:name", authenticateToken, webvncController.getWebVNCInstance);
router.post("/create", authenticateToken, webvncController.createWebVNCInstance);
router.post("/start", authenticateToken, webvncController.startWebVNCInstance);
router.post("/stop", authenticateToken, webvncController.stopWebVNCInstance);
router.post("/restart", authenticateToken, webvncController.restartWebVNCInstance);
router.post("/delete", authenticateToken, webvncController.deleteWebVNCInstance);

// Configuration management
router.post("/wireguard/update", authenticateToken, webvncController.updateWireguardConfig);

// User management
router.post("/users/add", authenticateToken, webvncController.addLoginUser);
router.post("/users/remove", authenticateToken, webvncController.removeLoginUser);
router.get("/users/:name", authenticateToken, webvncController.getLoginUsers);

// VNC device management
router.post("/devices/add", authenticateToken, webvncController.addVncDevice);
router.post("/devices/remove", authenticateToken, webvncController.removeVncDevice);
router.get("/devices/:name", authenticateToken, webvncController.getVncDevices);

module.exports = router;