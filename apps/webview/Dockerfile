# --------------------
# Frontend build stage
# --------------------
FROM node:lts-alpine AS frontend-builder

# Enable pnpm via corepack
RUN corepack enable

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/pnpm-workspace.yaml frontend/pnpm-lock.yaml ./

# Install frontend dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN pnpm build

# --------------------
# Backend build stage
# --------------------
FROM node:lts-alpine AS backend-builder

# Enable pnpm
RUN corepack enable

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY backend/package.json backend/pnpm-lock.yaml ./

# Install backend dependencies
RUN pnpm install --frozen-lockfile

# Copy backend source code
COPY backend/ ./

# Copy prisma schema for this specific app
COPY backend/prisma/ ./prisma/

# Generate Prisma Client
RUN pnpm prisma generate --generator client

# Build backend for production
RUN pnpm build

# Prune dev dependencies
RUN pnpm cache delete && pnpm prune --prod

# --------------------
# Production stage
# --------------------
FROM node:lts-alpine AS production

# Install dependencies: pnpm, dumb-init, supervisord, wireguard-tools, bash, iptables
RUN corepack enable && \
    apk add --no-cache dumb-init supervisor wireguard-tools iptables bash

# Set working directory
WORKDIR /app

# Copy backend build and dependencies
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package.json ./package.json
COPY --from=backend-builder /app/backend/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy frontend build output to backend's public directory
COPY --from=frontend-builder /app/frontend/dist ./public/frontend

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