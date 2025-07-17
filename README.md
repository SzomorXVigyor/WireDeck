# MultiWireGuard Deployment

## Overview

This project uses **Node.js** with **Express** for VPN server configuration generator. The solution includes a configurator WEB UI to easily generate configuration files, deploy multiple **Easy-WireGuard VPN servers**, and manage them using **Docker**. The deployment also includes an **NGINX reverse proxy** to handle the traffic routing for all VPN admin panel instances.

The project uses Docker to containerize the entire solution, allowing for easy setup and scalability.

## Features

- **Node.js/Express/EJS** based configurator for VPN server instance configuration generation
- Deploys multiple **Easy-WireGuard VPN servers** in Docker containers
- **NGINX reverse proxy** to route traffic web traffic
- Fully containerized deployment using **Docker Compose**
- Easy-to-use web UI for configuration generation
- Automated WireGuard docker compose configuration generation
- Scalable setup with Docker

## Requirements

- Docker and Docker Compose (for containerized deployment)
- Node.js 14.x or later and WireGuard (wg) (for the configurator server)
- A Linux-based machine or compatible OS to run docker containers

```sh
docker build -t wireguard-manager .
```

```sh
docker network create --driver bridge --subnet=172.20.0.0/24 wgnet
```

```sh
docker run -d \
  --name wireguard-manager \
  --network wgnet \
  --ip 172.20.0.2 \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd)/deployments:/app/deployments \
  -e INIT_USERNAME=admin \
  -e INIT_PASSWORD=your-password \
  -e INIT_HOST=your-server-ip \
  -e INSECURE=true \
  -e SERVER_HOST=10.101.2.7 \
  wireguard-manager
```
