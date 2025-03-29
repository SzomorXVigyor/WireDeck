# MultiWireGuard Deployment

## Overview

This project uses **Node.js** with **Express** and **EJS** for VPN server configuration generator. The solution includes a configurator WEB UI to easily generate configuration files, deploy multiple **WireGuard VPN servers**, and manage them using **Docker**. The deployment also includes an **NGINX reverse proxy** to handle the traffic routing for all VPN instances.

The project uses Docker to containerize the entire solution, allowing for easy setup and scalability.

## Features

- **Node.js/Express/EJS** based configurator for VPN server configuration generation
- Deploys multiple **WireGuard VPN servers** in Docker containers
- **NGINX reverse proxy** to route traffic to the appropriate VPN server
- Fully containerized deployment using **Docker Compose**
- Easy-to-use web UI for configuration generation
- Automated WireGuard configuration generation
- Scalable setup with Docker

## Requirements

- Docker and Docker Compose (for containerized deployment)
- Node.js 14.x or later and WireGuard (wg) (for the configurator server)
- A Linux-based machine or compatible OS to run docker containers
