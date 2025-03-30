const express = require("express");
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");
const basicAuth = require("express-basic-auth");
const ejs = require("ejs");

const app = express();
const CONFIG_DIR = "/config";
const PORT = 3000;

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Simple authentication
app.use(basicAuth({
  users: { "admin": "password" },  // Change this for security
  challenge: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function generateKeys() {
  //const privateKey = execSync("wg genkey").toString().trim();
  //const publicKey = execSync(`echo ${privateKey} | wg pubkey`).toString().trim();
  const privateKey = "privateKey";
  const publicKey = "publicKey";
  return { privateKey, publicKey };
}

// Function to read and parse the raw WireGuard config
function parseWireGuardConfig(configFile) {

  // Regular expressions for extracting sections
  const interfaceRegex = /\[Interface\]\s*([^[]+?)(?=\[|$)/g;
  const peerRegex = /\[Peer\]\s*([^[]+?)(?=\[|$)/g;
  const addressRegex = /Address\s*=\s*([\d.]+\/\d+)/;
  const publicKeyRegex = /PublicKey\s*=\s*([^\s]+)/;
  const allowedIpsRegex = /AllowedIPs\s*=\s*([^\s]+)/;

  const servers = [];

  let match;
  while ((match = interfaceRegex.exec(configFile)) !== null) {
    const interfaceSection = match[1];
    const addressMatch = addressRegex.exec(interfaceSection);

    if (addressMatch) {
      const network = addressMatch // Extract the network address
      const server = addressMatch[1]; // Extract only the IP
      const peers = [];

      // Extract peers within this section
      while ((peerMatch = peerRegex.exec(configFile)) !== null) {
        const peerSection = peerMatch[1];
        const publicKeyMatch = publicKeyRegex.exec(peerSection);
        const allowedIpsMatch = allowedIpsRegex.exec(peerSection);

        if (publicKeyMatch && allowedIpsMatch) {
          const publicKey = publicKeyMatch[1];
          const allowedIps = allowedIpsMatch[1].split(',').map(ip => ip.trim());

          peers.push({ PublicKey: publicKey, AllowedIPs: allowedIps });
        }
      }

      servers.push({ Network: network, Server: server, Peers: peers });
    }
  }

  return servers;
}

// Function to find the next available peer IP within a given network
function getNextAvailablePeerAddress(server) {

  const usedIPs = [];

  // Collect used IPs
  server.Peers.forEach(peer => {
    peer.AllowedIPs.forEach(allowedIP => {
      const ipAddress = allowedIP.split('/')[0]; // Remove CIDR notation
      if (ip.isPrivate(ipAddress)) {
        usedIPs.push(ipAddress);
      }
    });
  });

  // Find the next available IP
  for (let i = 2; i <= 254; i++) {
    const candidateIP = `${network.split('.')[0]}.${network.split('.')[1]}.${network.split('.')[2]}.${i}`;
    if (!usedIPs.includes(candidateIP)) {
      return candidateIP;
    }
  }

  return 'No available IP addresses';
}

// Function to find the next available /24 network address
function getNextAvailableNetwork(servers, baseNetwork = "10.0.0.0/24") {
  const usedNetworks = servers.map(server => server.Network);

  let baseParts = baseNetwork.split('.')[3]; // Get the third octet
  let subnet = 0;

  while (subnet < 255) {
    const candidateNetwork = `10.0.${subnet}.0`;
    if (!usedNetworks.includes(candidateNetwork)) {
      return `${candidateNetwork}/24`;
    }
    subnet++;
  }

  return "No available network addresses";
}

app.get("/", (req, res) => {
  // Example usage
  const filePath = `
    [Interface]
    Address = 10.0.0.1/24
    ListenPort = 51820
    PrivateKey = aBrWDAO8XmG6+aG7dJuuFQMRH31dCwX/meJyPnwp8mo=
    PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

    [Peer]
    PublicKey = +8a8/H7kOkaGUhJSCbajC/VOrN2zjIU0s5bFqy+w3RQ=
    AllowedIPs = 10.0.0.2/32

    [Peer]
    PublicKey = 69D9YvvemezRK9ltaail9D5a5KKdFN5dU140ZkDBvQU=
    AllowedIPs = 10.0.0.3/32

    [Peer]
    PublicKey = Lz/E3qqKVlJWs2yzcUwqUiPlRzat6oRnbmuKm5Nbk2A=
    AllowedIPs = 10.0.0.4/32
    `;
  const servers = parseWireGuardConfig(filePath);

  // Find next peer IP in a specific network
  const nextPeerAddress = getNextAvailablePeerAddress(servers[0]);
  console.log('Next available peer IP:', nextPeerAddress);

  // Find the next available network
  const nextNetwork = getNextAvailableNetwork(servers);
  console.log('Next available network:', nextNetwork);
  res.render("index");
});

app.post("/add-server", (req, res) => {
  const { server_name } = req.body;
  if (!server_name) {
    return res.redirect("/");
  }

  res.redirect("/");
});

app.post("/add-client", (req, res) => {
  const { server_name, client_name } = req.body;
  if (!client_name || !server_name) {
    return res.redirect("/");
  }

  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
