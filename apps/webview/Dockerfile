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