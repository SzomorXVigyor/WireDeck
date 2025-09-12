# --------------------
# Frontend build stage
# --------------------
FROM node:18-alpine AS frontend-builder

# Enable yarn via corepack
RUN corepack enable

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json ./

# Install frontend dependencies
RUN yarn install

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN yarn build


# --------------------
# Backend build stage
# --------------------
FROM node:18-alpine AS backend-builder

# Enable yarn
RUN corepack enable

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY backend/package.json ./

# Install backend dependencies
RUN yarn install

# Copy backend source code
COPY backend/ ./

# Build backend for production
RUN yarn build


# --------------------
# noVNC downloader stage
# --------------------
FROM alpine:latest AS novnc-downloader

# Install required tools
RUN apk add --no-cache wget unzip

# Set working directory
WORKDIR /novnc

# Download and extract noVNC
ARG NOVNC_VERSION=1.6.0
RUN wget -O novnc.zip "https://github.com/novnc/noVNC/archive/refs/tags/v${NOVNC_VERSION}.zip" && \
    unzip novnc.zip && \
    mv noVNC-${NOVNC_VERSION}/* . && \
    rm -rf noVNC-${NOVNC_VERSION} novnc.zip

# Clean up unnecessary files to reduce image size
RUN rm -rf \
    .github docs tests utils/websockify utils/launch.sh utils/novnc_proxy \
    karma.conf.js .eslintrc.js *.md


# --------------------
# Production stage
# --------------------
FROM node:18-alpine AS production

# Install dependencies: yarn, dumb-init, supervisord, wireguard-tools, bash, iptables
RUN corepack enable && \
    apk add --no-cache dumb-init supervisor wireguard-tools iptables bash

# Set working directory
WORKDIR /app

# Copy backend build and dependencies
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package.json ./package.json
COPY --from=backend-builder /app/backend/yarn.lock ./yarn.lock

# Copy frontend build output to backend's public directory
COPY --from=frontend-builder /app/frontend/dist ./public/frontend

# Copy noVNC files
COPY --from=novnc-downloader /novnc ./public/novnc
COPY novnc_defaults.json ./public/novnc/defaults.json

# Create required directories
RUN mkdir -p /etc/wireguard /var/log/supervisor

# Copy startup scripts and supervisord config
COPY scripts/start-wireguard.sh /scripts/start-wireguard.sh
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Ensure scripts are executable
RUN chmod +x /scripts/start-wireguard.sh

# Expose backend port
EXPOSE 8080

# Health check for backend
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start both backend and WireGuard under supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
