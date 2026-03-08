# ──────────────────────────────────────────────────────────────────────────────
# Prisma migration container for the webview database.
#
# This image has ONE job: on startup it waits for PostgreSQL to accept
# connections and then applies all pending Prisma migrations via
#   npx prisma migrate deploy
# It exits with code 0 on success and non-zero on failure.
#
# Build context: apps/webview/database/
#
# Required environment variable at runtime:
#   DATABASE_URL  –  postgresql://user:pass@host:5432/dbname
# ──────────────────────────────────────────────────────────────────────────────

FROM node:24-alpine

# postgresql-client provides pg_isready, used in the entrypoint to wait for the
# database to accept connections before attempting migrations.
RUN apk add --no-cache postgresql-client

WORKDIR /app

# ── Install Prisma CLI ────────────────────────────────────────────────────────
# Copy the manifest first so npm install is cached unless package.json changes.
COPY package.json package-lock.json* ./
RUN npm install --no-save

# ── Copy schema & migrations ──────────────────────────────────────────────────
# schema.prisma is always present.
# migrations/ is optional: the directory is created in the image so that
# "prisma migrate deploy" never fails when no migration files exist yet.
COPY schema.prisma ./
RUN mkdir -p /app/migrations
# This intentionally uses COPY . . so that migrations/ is included when it
# exists in the build context but the build does not fail when it is absent.
COPY . .

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV DATABASE_URL=""

ENTRYPOINT ["/entrypoint.sh"]
