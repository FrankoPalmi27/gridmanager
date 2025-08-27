.PHONY: install dev build test clean docker-up docker-down seed

# Install all dependencies
install:
	pnpm install

# Start development servers
dev:
	pnpm run dev

# Build all projects
build:
	pnpm run build

# Run tests
test:
	pnpm run test

# Clean dependencies and build artifacts
clean:
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf apps/*/dist
	rm -rf packages/*/dist

# Start Docker services
docker-up:
	docker compose up -d

# Stop Docker services
docker-down:
	docker compose down

# Run database migrations
migrate:
	pnpm run db:migrate

# Seed the database
seed:
	pnpm run db:seed

# Reset database (migrations + seed)
db-reset:
	pnpm run db:reset

# Setup project for first time
setup: install migrate seed

# Full development setup
dev-setup: docker-up setup dev