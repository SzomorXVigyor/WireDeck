<p align="center">
<img src="./assets/banner.png">
</p>
<p align="center">
<img alt="Github top language" src="https://img.shields.io/github/languages/top/SzomorXVigyor/WireDeck?color=8f3d3d">
<img alt="Repository size" src="https://img.shields.io/github/repo-size/SzomorXVigyor/WireDeck?color=532BEAF">
<img alt="License" src="https://img.shields.io/github/license/SzomorXVigyor/WireDeck?color=56BEB8">
</p>

## Overview

This project uses **Node.js** with **Express** for VPN server managment. The solution includes a WEB UI to easily deploy multiple [**Easy-WireGuard VPN servers**](https://github.com/wg-easy/wg-easy), and manage them using **dockerode**. The deployment also includes an **NGINX reverse proxy** to handle the traffic routing for all VPN admin panel instances.

The project require **Docker** on host to containerize the entire solution, allowing for easy setup and scalability.



## Deploy

#### 0. Clone the repo
```
git clone https://github.com/SzomorXVigyor/WireDeck.git
```

#### 1. Configuration
Create .env configuration from .env.example

```sh
# Domain of the application
ROOT_DOMAIN=example.com

# Default username and password for the admin user of manager and wireguard instances
INIT_USERNAME=admin
INIT_PASSWORD=your-password

# email address for receiving certbot notifications
CERTBOT_EMAIL=email@example.com

# JWT secret for securing application
JWT_SECRET=your-jwt-secret
```

#### 2. Create docker network

```sh
docker network create --driver bridge --subnet=172.20.0.0/23 wgnet
```

#### 3. Create work directories

```sh
mkdir -p database nginx/sites
```

#### 4. Obtain root certificate
It will automaticly renew by cert manager module.

```sh
docker run --rm -v $(pwd)/certbot/conf:/etc/letsencrypt -v $(pwd)/certbot/www:/var/www/certbot -p 80:80 certbot/certbot certonly --standalone --email your-email@domain.com --agree-tos --no-eff-email -d your-domain.com
```

#### 5. Start the app

```sh
docker compose --env-file .env up -d
```
