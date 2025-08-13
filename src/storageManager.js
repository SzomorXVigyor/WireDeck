const fs = require("fs");
const path = require("path");

const statePath = path.join(__dirname, "database", "db.json");

function loadState() {
	try {
		if (!fs.existsSync(statePath)) {
			const initialState = {
				instances: {},
				users: {},
			};
			saveState(initialState);
			return initialState;
		}
		return JSON.parse(fs.readFileSync(statePath));
	} catch (error) {
		console.error("Error loading state:", error);
		return {
			instances: {},
			users: {},
		};
	}
}

function saveState(state) {
	try {
		fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
	} catch (error) {
		console.error("Error saving state:", error);
		throw error;
	}
}

function allocateInstance(name, options = {}) {
	const state = loadState();
	if (state.instances[name]) throw new Error("Instance already exists");

	// Get the next available index by finding the maximum existing index + 1
	const existingIndices = Object.values(state.instances).map((instance) => instance.index);
	const maxIndex = existingIndices.length > 0 ? Math.max(...existingIndices) : -1;
	const index = maxIndex + 1;

	const ipv4 = `172.20.1.${index + 1}`; // Start from 172.20.1.1
	const udpPort = 51820 + index;

	state.instances[name] = {
		index,
		ipv4,
		udpPort,
		username: options.username || process.env.INIT_USERNAME,
		password: options.password || process.env.INIT_PASSWORD,
		ipv4Cidr: options.ipv4Cidr || "172.21.0.0/24",
		createdAt: new Date().toISOString(),
	};

	saveState(state);
	return state.instances[name];
}

function freeInstance(name) {
	const state = loadState();
	if (!state.instances[name]) return;

	delete state.instances[name];
	saveState(state);
}

function createUser(username, password) {
	const state = loadState();
	const bcrypt = require("bcrypt");

	state.users[username] = {
		password: bcrypt.hashSync(password, 10),
		createdAt: new Date().toISOString(),
	};

	saveState(state);
}

function updateUserPassword(username, newPassword) {
	const state = loadState();
	const bcrypt = require("bcrypt");

	if (!state.users[username]) {
		throw new Error("User not found");
	}

	state.users[username].password = bcrypt.hashSync(newPassword, 10);
	state.users[username].updatedAt = new Date().toISOString();

	saveState(state);
}

function getUser(username) {
	const state = loadState();
	return state.users[username];
}

function validateUser(username, password) {
	const user = getUser(username);
	if (!user) return false;

	const bcrypt = require("bcrypt");
	return bcrypt.compareSync(password, user.password);
}

module.exports = {
	loadState,
	saveState,
	allocateInstance,
	freeInstance,
	createUser,
	updateUserPassword,
	getUser,
	validateUser,
};
