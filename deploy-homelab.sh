#!/bin/bash
# Drizzle Homelab Deployment Script
# Run this script from the drizzle directory on the homelab

set -e

echo "=== Drizzle Homelab Deployment ==="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Create .env file with the following variables:"
    echo "  DB_PASSWORD=your-secure-database-password"
    echo "  NEXTAUTH_URL=http://homelab:3100"
    echo "  NEXTAUTH_SECRET=your-secret-key (run: openssl rand -base64 32)"
    exit 1
fi

# Validate required environment variables
source .env
if [ -z "$DB_PASSWORD" ] || [ -z "$NEXTAUTH_SECRET" ]; then
    echo "ERROR: Required environment variables not set in .env"
    echo "Required: DB_PASSWORD, NEXTAUTH_SECRET"
    exit 1
fi

echo "Building and starting containers..."
docker compose -f docker-compose.homelab.yml down 2>/dev/null || true
docker compose -f docker-compose.homelab.yml build --no-cache
docker compose -f docker-compose.homelab.yml up -d

echo "Waiting for database to be ready..."
sleep 10

echo "Running database migrations..."
docker compose -f docker-compose.homelab.yml exec app npx prisma migrate deploy

echo "Seeding database (if needed)..."
docker compose -f docker-compose.homelab.yml exec app npx prisma db seed || echo "Seed skipped (may already be seeded)"

echo ""
echo "=== Deployment Complete ==="
echo "Access Drizzle at: http://homelab:3100"
echo ""
echo "Check logs with: docker compose -f docker-compose.homelab.yml logs -f"
echo "Stop with: docker compose -f docker-compose.homelab.yml down"
