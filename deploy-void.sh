#!/bin/bash

# Deploy Drizzle Quiz App to Void Server via Tailscale
# Run this script from the drizzle directory on void
# Uses Tailscale serve on port 8443 for HTTPS

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="docker-compose.void.yml"

# Check requirements
check_requirements() {
    log_info "Checking requirements..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    fi

    log_success "Docker and Docker Compose are available"
}

# Check environment file
check_env() {
    log_info "Checking environment configuration..."

    if [ ! -f "${SCRIPT_DIR}/.env" ]; then
        log_warning ".env file not found"
        log_info "Creating .env from .env.void.example..."

        if [ -f "${SCRIPT_DIR}/.env.void.example" ]; then
            cp "${SCRIPT_DIR}/.env.void.example" "${SCRIPT_DIR}/.env"
            log_warning "Please edit .env with your actual credentials:"
            log_warning "  - DB_PASSWORD: Generate with 'openssl rand -base64 32'"
            log_warning "  - NEXTAUTH_SECRET: Generate with 'openssl rand -base64 32'"
            exit 1
        else
            log_error ".env.void.example not found"
            exit 1
        fi
    fi

    # Validate required variables
    source "${SCRIPT_DIR}/.env"

    if [ -z "${DB_PASSWORD:-}" ] || [ "${DB_PASSWORD}" == "your-secure-database-password-here" ]; then
        log_error "DB_PASSWORD is not set or still has default value"
        log_error "Generate with: openssl rand -base64 32"
        exit 1
    fi

    if [ -z "${NEXTAUTH_SECRET:-}" ] || [ "${NEXTAUTH_SECRET}" == "your-secret-key-here-generate-with-openssl-rand-base64-32" ]; then
        log_error "NEXTAUTH_SECRET is not set or still has default value"
        log_error "Generate with: openssl rand -base64 32"
        exit 1
    fi

    log_success "Environment configuration valid"
}

# Deploy the application
deploy() {
    log_info "Deploying Drizzle Quiz App..."

    cd "${SCRIPT_DIR}"

    # Pull latest base images
    log_info "Pulling base images..."
    docker pull node:20-bookworm-slim
    docker pull postgres:15-alpine

    # Build and start containers
    log_info "Building and starting containers..."
    docker compose -f "${COMPOSE_FILE}" up -d --build

    # Wait for health check
    log_info "Waiting for application to be healthy..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker compose -f "${COMPOSE_FILE}" ps | grep -q "healthy"; then
            log_success "Application is healthy"
            break
        fi

        if [ $attempt -eq $max_attempts ]; then
            log_warning "Health check timed out, checking logs..."
            docker compose -f "${COMPOSE_FILE}" logs --tail=50 app
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo ""

    # Run database migrations
    log_info "Running database migrations..."
    docker compose -f "${COMPOSE_FILE}" exec -T app npx prisma migrate deploy || {
        log_warning "Migration command failed, database may need initialization"
        log_info "Attempting to push schema..."
        docker compose -f "${COMPOSE_FILE}" exec -T app npx prisma db push
    }

    log_success "Database migrations complete"
}

# Setup Tailscale serve for HTTPS on port 8443
setup_tailscale_serve() {
    log_info "Setting up Tailscale serve for HTTPS on port 8443..."

    if ! command -v tailscale &> /dev/null; then
        log_error "Tailscale is not installed"
        exit 1
    fi

    # Configure Tailscale to serve HTTPS on port 8443 -> localhost:3100
    # Port 8443 is a Tailscale-supported HTTPS port (like Goal Tracker uses 443)
    sudo tailscale serve --https=8443 --bg http://localhost:3100

    log_success "Tailscale serve configured (HTTPS on port 8443)"
}

# Show status
show_status() {
    echo ""
    echo "=============================================="
    log_success "Drizzle Quiz App deployed successfully!"
    echo "=============================================="
    echo ""
    log_info "Access the application at:"
    log_info "  - Local: http://localhost:3100"
    log_info "  - Tailscale HTTPS: https://void.tail517c12.ts.net:8443"
    echo ""
    log_info "Container status:"
    docker compose -f "${COMPOSE_FILE}" ps
    echo ""
    log_info "Useful commands:"
    log_info "  View logs:    docker compose -f ${COMPOSE_FILE} logs -f"
    log_info "  Stop:         docker compose -f ${COMPOSE_FILE} down"
    log_info "  Restart:      docker compose -f ${COMPOSE_FILE} restart"
    log_info "  Rebuild:      docker compose -f ${COMPOSE_FILE} up -d --build"
    echo ""
}

# Reseed database with latest questions
reseed() {
    log_info "Re-seeding database with latest questions..."

    cd "${SCRIPT_DIR}"

    # Run the reseed command inside the container
    docker compose -f "${COMPOSE_FILE}" exec -T app npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed/questions.ts --force

    log_success "Database re-seeded successfully"
}

# Main
main() {
    case "${1:-deploy}" in
        reseed)
            log_info "Re-seeding database..."
            check_requirements
            reseed
            ;;
        deploy|*)
            log_info "Starting Drizzle deployment to Void..."
            echo ""
            check_requirements
            check_env
            deploy
            setup_tailscale_serve
            show_status
            ;;
    esac
}

main "$@"
