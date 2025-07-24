# Wireguard-Instance-Manager 

## Overview

This project uses **Node.js** with **Express** for VPN server configuration generator. The solution includes a configurator WEB UI to easily generate configuration files, deploy multiple **Easy-WireGuard VPN servers**, and manage them using **Docker**. The deployment also includes an **NGINX reverse proxy** to handle the traffic routing for all VPN admin panel instances.

The project uses Docker to containerize the entire solution, allowing for easy setup and scalability.

## Features

- **Node.js/Express** based configurator for VPN server instance configuration generation
- Deploys multiple **Easy-WireGuard VPN servers** in Docker containers
- **NGINX reverse proxy** to route traffic web traffic
- Fully containerized deployment using **Docker Compose**
- Easy-to-use web UI for configuration generation

## Dev deploy

```sh
docker network create --driver bridge --subnet=172.20.0.0/23 wgnet
```

```sh
mkdir -p database nginx/sites
```

```sh
docker run --rm -v $(pwd)/certbot/conf:/etc/letsencrypt -v $(pwd)/certbot/www:/var/www/certbot -p 80:80 certbot/certbot certonly --standalone --email your-email@domain.com --agree-tos --no-eff-email -d your-domain.com
```

```sh
docker-compose up -d --build
```
