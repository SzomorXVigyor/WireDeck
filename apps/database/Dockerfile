# Prisma migration container for the webview database.
#
# This image has ONE job: on startup it runs the Prisma migration deploy for the provided database, then exits.
# DATABASE_URL: the raw URL of the database
# SERVICE_IDENTIFIER: the identifier of the service, used to determine the database name and the migration path
# SERVICE_NAME: the name of the service, used to determine the schema

# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --non-interactive --silent && \
    yarn cache clean

# Runtime stage
FROM node:24-alpine AS production

WORKDIR /app

# Copy dependencies and strip unnecessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Remove unnecessary files from node_modules
RUN find ./node_modules -type d -name ".bin" -exec rm -rf {} + 2>/dev/null || true && \
    find ./node_modules -type f \( -name "*.md" -o -name "*.map" -o -name "*.ts" \) -delete && \
    find ./node_modules -type d \( -name "test" -o -name "tests" -o -name "example" -o -name "examples" \) -exec rm -rf {} + 2>/dev/null || true

# Copy prisma config
COPY prisma.config.ts ./

# Copy versioned schemas and migrations
COPY prisma ./prisma/
COPY migrations ./migrations/

# Run Prisma migration on startup
ENTRYPOINT ["npx", "prisma", "migrate", "deploy", "--config", "prisma.config.ts"]