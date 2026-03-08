#!/bin/sh
set -e

# ──────────────────────────────────────────────────────────────────────────────
# Parse DATABASE_URL to extract host, port and user for pg_isready.
# Node.js is already available in the image; avoids complex shell URL parsing.
# ──────────────────────────────────────────────────────────────────────────────
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  exit 1
fi

eval "$(node -e "
const url = new URL(process.env.DATABASE_URL);
process.stdout.write('DB_HOST=' + url.hostname + '\n');
process.stdout.write('DB_PORT=' + (url.port || '5432') + '\n');
process.stdout.write('DB_USER=' + url.username + '\n');
")"

# ──────────────────────────────────────────────────────────────────────────────
# Wait until PostgreSQL accepts connections.
# ──────────────────────────────────────────────────────────────────────────────
MAX_RETRIES=30
RETRY_INTERVAL=2
attempt=0

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT} (user: ${DB_USER})..."

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: PostgreSQL not ready after ${MAX_RETRIES} attempts. Giving up."
    exit 1
  fi
  echo "  [${attempt}/${MAX_RETRIES}] Not ready yet — retrying in ${RETRY_INTERVAL}s..."
  sleep "$RETRY_INTERVAL"
done

echo "PostgreSQL is ready."

# ──────────────────────────────────────────────────────────────────────────────
# Apply all pending migrations.
# prisma migrate deploy is non-interactive and safe for production / CI.
# It creates the migrations table on first run and applies any new migration
# files committed under ./migrations/ since the last run.
# ──────────────────────────────────────────────────────────────────────────────
echo "Running: prisma migrate deploy"
npx prisma migrate deploy --schema=/app/schema.prisma

echo "Database schema is up to date."
