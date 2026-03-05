const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock data
const mockUsers = [
	{
		id: 1,
		username: "admin",
		password: "admin",
		role: "admin",
	},
	{
		id: 2,
		username: "user",
		password: "password",
		role: "user",
	},
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
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const token = authHeader.substring(7);
	const userId = verifyToken(token);

	if (!userId) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}

	const user = mockUsers.find((u) => u.id === userId);
	if (!user) {
		return res.status(401).json({ message: "User not found" });
	}

	req.user = { id: user.id, username: user.username, email: user.email, role: user.role };
	next();
};

// Routes

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ message: "Username and password are required" });
	}

	const user = mockUsers.find((u) => u.username === username && u.password === password);

	if (!user) {
		return res.status(401).json({ message: "Invalid credentials" });
	}

	const token = generateToken(user.id);
	activeSessions.set(token, user.id);

	res.status(201).json({
		access_token: token,
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
			role: user.role,
		},
	});
});

// GET /api/auth/profile
app.get("/api/auth/profile", authenticate, (req, res) => {
	res.json({
		user: req.user,
	});
});

// POST /api/auth/logout
app.post("/api/auth/logout", authenticate, (req, res) => {
	const authHeader = req.headers.authorization;
	const token = authHeader.substring(7);
	activeSessions.delete(token);

	res.json({ message: "Logged out successfully" });
});

// GET /api/config
app.get("/api/config", (req, res) => {
	res.json({
		features: {
			passwordChange: true,
		},
		version: "1.0.0",
		environment: "mock",
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// Views mock data
// ─────────────────────────────────────────────────────────────────────────────

const mockViews = [
	{ id: 1, name: "Power Control" },
	{ id: 2, name: "Temperature & Climate" },
];

const mockViewDetails = {
	1: {
		id: 1,
		name: "Power Control",
		layout: { type: "fill", updateInterval: 5 },
		components: [
			{
				id: 1,
				name: "Main Switch",
				type: "button",
				order: 1,
				register: 100,
				style: { color: "primary", size: "md" },
				extra: { label: "Toggle Power", confirmAction: true },
			},
			{
				id: 2,
				name: "Pump",
				type: "switch",
				order: 2,
				register: 101,
				style: { color: "green" },
				extra: { onLabel: "Running", offLabel: "Stopped" },
			},
			{
				id: 3,
				name: "Voltage",
				type: "display",
				order: 3,
				register: 102,
				style: { unit: "V", fontSize: "lg" },
				extra: { precision: 1 },
			},
			{
				id: 4,
				name: "Current",
				type: "display",
				order: 4,
				register: 103,
				style: { unit: "A", fontSize: "lg" },
				extra: { precision: 2 },
			},
			{
				id: 5,
				name: "Load",
				type: "display",
				order: 5,
				register: 104,
				style: { unit: "W", fontSize: "md" },
				extra: { precision: 0 },
			},
		],
	},
	2: {
		id: 2,
		name: "Temperature & Climate",
		layout: { type: "fixed", updateInterval: 10 },
		components: [
			{
				id: 6,
				name: "Room Temperature",
				type: "display",
				order: 1,
				register: 200,
				style: { unit: "°C", fontSize: "xl" },
				extra: { precision: 1 },
			},
			{
				id: 7,
				name: "Target Temperature",
				type: "number-input",
				order: 2,
				register: 201,
				style: { unit: "°C", min: 16, max: 30 },
				extra: { step: 0.5, placeholder: "22" },
			},
			{
				id: 8,
				name: "Heater",
				type: "switch",
				order: 3,
				register: 202,
				style: { color: "red" },
				extra: { onLabel: "Heating", offLabel: "Off" },
			},
			{
				id: 9,
				name: "Cooling",
				type: "switch",
				order: 4,
				register: 203,
				style: { color: "blue" },
				extra: { onLabel: "Cooling", offLabel: "Off" },
			},
			{
				id: 10,
				name: "Humidity",
				type: "display",
				order: 5,
				register: 204,
				style: { unit: "%", fontSize: "md" },
				extra: { precision: 0 },
			},
			{
				id: 11,
				name: "Ventilation Mode",
				type: "button",
				order: 6,
				register: 205,
				style: { color: "secondary", size: "sm" },
				extra: { label: "Cycle Mode", confirmAction: false },
			},
		],
	},
};

// GET /api/views
app.get("/api/views", authenticate, (req, res) => {
	res.json(mockViews);
});

// GET /api/view/:id
app.get("/api/view/:id", authenticate, (req, res) => {
	const id = parseInt(req.params.id, 10);
	const view = mockViewDetails[id];
	if (!view) {
		return res.status(404).json({ message: `View with id ${id} not found` });
	}
	res.json(view);
});

// ── Register data storage (mutable mock state) ───────────────────────────────
// Seed initial values for every register across all views.
const mockRegisterData = {};

(function seedRegisters() {
	Object.values(mockViewDetails).forEach((view) => {
		view.components.forEach((card) => {
			if (!(card.register in mockRegisterData)) {
				// Sensible defaults per card type
				if (card.type === "button") mockRegisterData[card.register] = 0;
				else if (card.type === "switch") mockRegisterData[card.register] = 0;
				else if (card.type === "display") {
					// Seed with a realistic value that will drift slightly each poll
					mockRegisterData[card.register] = parseFloat((10 + (card.register % 100) * 0.37).toFixed(2));
				} else if (card.type === "number-input") {
					const style = card.style;
					mockRegisterData[card.register] = style.min !== undefined ? style.min : 0;
				}
			}
		});
	});
})();

// Gently drift display register values to simulate live data
setInterval(() => {
	Object.values(mockViewDetails).forEach((view) => {
		view.components.forEach((card) => {
			if (card.type === "display") {
				const current = mockRegisterData[card.register] ?? 0;
				const delta = (Math.random() - 0.5) * 2;
				mockRegisterData[card.register] = parseFloat((current + delta).toFixed(2));
			}
		});
	});
}, 2000);

// GET /api/view/:id/data
app.get("/api/view/:id/data", authenticate, (req, res) => {
	const id = parseInt(req.params.id, 10);
	const view = mockViewDetails[id];
	if (!view) {
		return res.status(404).json({ message: `View with id ${id} not found` });
	}
	const result = view.components.map((card) => ({
		register: card.register,
		value: mockRegisterData[card.register] ?? 0,
	}));
	res.json(result);
});

// POST /api/view/:id/data
app.post("/api/view/:id/data", authenticate, (req, res) => {
	const id = parseInt(req.params.id, 10);
	const view = mockViewDetails[id];
	if (!view) {
		return res.status(404).json({ message: `View with id ${id} not found` });
	}
	const { register, value } = req.body;
	if (register === undefined || value === undefined) {
		return res.status(400).json({ message: "Body must contain { register, value }" });
	}
	const addr = parseInt(register, 10);
	const known = view.components.some((c) => c.register === addr);
	if (!known) {
		return res.status(404).json({ message: `Register ${addr} not part of view ${id}` });
	}
	mockRegisterData[addr] = value;
	res.json({ register: addr, value });
});

// ─────────────────────────────────────────────────────────────────────────────

// GET /api/health
app.get("/api/health", (req, res) => {
	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: {
			users: mockUsers.length,
			wireguard: {
				status: "connected",
				details: "This is a mock",
			},
		},
	});
});

// Catch-all for undefined routes
app.use("*", (req, res) => {
	res.status(404).json({ message: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ message: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
	console.log(`Mock backend server running on http://localhost:${PORT}`);
	console.log("\nAvailable endpoints:");
	console.log("  POST   /api/auth/login");
	console.log("  GET    /api/auth/profile (authenticated)");
	console.log("  POST   /api/auth/logout (authenticated)");
	console.log("  GET    /api/config");
	console.log("  GET    /api/health");
	console.log("  GET    /api/views        (authenticated)");
	console.log("  GET    /api/view/:id     (authenticated)");
	console.log("  GET    /api/view/:id/data   (authenticated)");
	console.log("  POST   /api/view/:id/data   (authenticated)");
	console.log("\nMock credentials:");
	console.log("  Username: admin, Password: admin");
	console.log("  Username: user, Password: password");
});
