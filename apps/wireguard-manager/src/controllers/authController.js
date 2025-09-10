const jwt = require("jsonwebtoken");
const storageManager = require("../modules/storageManager");

const JWT_SECRET = process.env.JWT_SECRET;

// Authentication middleware
function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Access token required" });
	}

	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({ error: "Invalid or expired token" });
		}
		req.user = user;
		next();
	});
}

// Login endpoint
async function login(req, res) {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ error: "Username and password required" });
	}

	try {
		const isValid = storageManager.UserHandler.validateUser(username, password);
		if (!isValid) {
			console.warn(`Failed login attempt for user: ${username} at ${new Date().toISOString()}`);
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
		console.log(`User logged in: ${username} at ${new Date().toISOString()}`);
		res.json({ token, username, message: "Login successful" });
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Login failed" });
	}
}

// Change password endpoint
async function changePassword(req, res) {
	const { currentPassword, newPassword } = req.body;
	const username = req.user.username;

	if (!currentPassword || !newPassword) {
		return res.status(400).json({ error: "Current password and new password required" });
	}

	if (newPassword.length < 6) {
		return res.status(400).json({ error: "New password must be at least 6 characters long" });
	}

	try {
		const isValidCurrent = storageManager.UserHandler.validateUser(username, currentPassword);
		if (!isValidCurrent) {
			return res.status(401).json({ error: "Current password is incorrect" });
		}

		storageManager.UserHandler.updateUserPassword(username, newPassword);
		res.json({ message: "Password changed successfully" });
	} catch (error) {
		console.error("Password change error:", error);
		res.status(500).json({ error: "Password change failed" });
	}
}

module.exports = {
	authenticateToken,
	login,
	changePassword
};