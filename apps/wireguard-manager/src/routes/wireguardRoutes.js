const express = require("express");
const wireguardController = require("../controllers/wireguardController");
const { authenticateToken } = require("../controllers/authController");

const router = express.Router();

router.get("/instances", authenticateToken, wireguardController.getAllInstances);
router.post("/create", authenticateToken, wireguardController.createInstance);
router.post("/start", authenticateToken, wireguardController.startInstance);
router.post("/stop", authenticateToken, wireguardController.stopInstance);
router.post("/restart", authenticateToken, wireguardController.restartInstance);
router.post("/delete", authenticateToken, wireguardController.deleteInstance);

module.exports = router;