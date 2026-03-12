# Prisma migration container for the webview database.
#
# This image has ONE job: on startup it runs the Prisma migration deploy for the provided database, then exits.
# DATABASE_URL: the raw URL of the database
# SERVICE_IDENTIFIER: the identifier of the service, used to determine the database name and the migration path
# SERVICE_NAME: the name of the service, used to determine the schema

FROM node:24-alpine

WORKDIR /app

# Install dependencies (prisma CLI)
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --non-interactive --silent

# Copy prisma config
COPY prisma.config.ts ./

# Copy versioned schemas and migrations
COPY prisma ./prisma/
COPY migrations ./migrations/


