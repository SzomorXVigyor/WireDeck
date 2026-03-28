# Database migration tool

This app for deploy service schemas to postgresql.

### Build the image:
```bash
docker build -t dbmigrator .
```

### Manual migration also use this on first deploy:
```bash
docker run --rm -e DATABASE_URL="postgresql://postgres:password@localhost:5432" -e SERVICE_IDENTIFIER="wiredeck-manager" -e SERVICE_NAME="wiredeck-manager" dbmigrator
```

### Generate a migration file locally:
Set the envs:
* DATABASE_URL="postgresql://postgres:password@localhost:5432"
* SERVICE_IDENTIFIER="wiredeck-manager"
* SERVICE_NAME="wiredeck-manager"

```bash
yarn prisma migrate dev
```

### Distribute the schema files to other services:
```bash
./distribute-schemas.sh
```