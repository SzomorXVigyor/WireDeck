FROM node:lts-alpine

# Enable pnpm via corepack
RUN corepack enable

WORKDIR /app

# Copy frontend package files
COPY ./package.json ./pnpm-workspace.yaml ./pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application files
COPY ./src/ ./

# Create used directory
RUN mkdir -p database
RUN mkdir -p nginx

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start:docker"]