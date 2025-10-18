# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a PatternFly FastAPI template for building full-stack applications with React frontend (Vite + PatternFly UI) and FastAPI backend, designed for deployment to OpenShift using Docker containers and Kustomize.

## Project Structure

```
├── backend/              # FastAPI backend
│   ├── main.py          # Main FastAPI application entry point
│   ├── app/             # Application code
│   │   └── api/        # API routes (versioned: /api/v1/...)
│   ├── pyproject.toml   # Python dependencies (managed by uv)
│   └── Dockerfile       # Backend container
├── frontend/            # React frontend with Vite + PatternFly
│   ├── src/
│   │   └── app/        # App components (Dashboard, Settings, Support, etc.)
│   ├── package.json    # Node.js dependencies
│   ├── vite.config.ts  # Vite configuration with /api proxy
│   └── Dockerfile      # Frontend container (nginx-based)
├── k8s/                # Kubernetes/OpenShift manifests
│   ├── base/          # Base kustomize resources
│   └── overlays/      # Environment-specific overlays (dev/prod)
└── scripts/           # Deployment automation scripts
```

## Development Commands

### Local Development (Node.js/Python)
```bash
make setup             # Install all dependencies
make dev              # Run both frontend and backend
make dev-frontend     # Run React dev server (port 8080)
make dev-backend      # Run FastAPI server (port 8000)
make help             # Show all available commands
```

### Database Management (PostgreSQL)
```bash
make db-start         # Start PostgreSQL development container
make db-stop          # Stop PostgreSQL container
make db-status        # Check if PostgreSQL is running
make db-init          # Run Alembic migrations to create database schema
make db-seed          # Populate database with test data (3 users, 8 items)
make db-shell         # Open PostgreSQL shell (psql)
make db-logs          # Show PostgreSQL logs
make db-reset         # Remove container and delete all data (destructive)
```

**Database Configuration:**
- Container: `app-postgres-dev`
- Volume: `app-db-data` (persistent storage)
- Default credentials: `app/changethis`
- Default database: `app`
- Port: `5432`
- PostgreSQL version: 15-alpine
- ORM: SQLModel with Alembic migrations

### Building
```bash
make build                 # Build frontend and container images
```

### Testing
```bash
make test                    # Run all tests (frontend and backend)
make test-frontend           # Run Vitest tests
make test-backend            # Run pytest tests
make test-backend-verbose    # Run pytest with verbose output
make test-backend-coverage   # Run pytest with coverage report
make test-backend-watch      # Run pytest in watch mode
make test-e2e                # Run Playwright E2E tests (requires backend + db running)
make test-e2e-ui             # Run E2E tests with Playwright UI (interactive)
make test-e2e-headed         # Run E2E tests in headed mode (visible browser)
make lint                    # Run ESLint on frontend
```

**E2E Test Prerequisites:**
Before running E2E tests, ensure these services are running:
```bash
make db-start && make db-init && make db-seed  # Start database with test data
make dev-backend                                # Start backend API server
# Frontend is started automatically by Playwright
```

### Container Registry (Quay.io)
```bash
make build                                      # Build frontend and container images (default: latest)
make push                                       # Push images only (default: latest)
make build-prod                                 # Build with prod tag (for production deployment)
make push-prod                                  # Push with prod tag
make build TAG=latest                           # Build with latest tag (explicit)
make push TAG=latest                            # Push with latest tag (explicit)
make TAG=v1.0.0 REGISTRY=quay.io/cfchase       # Custom registry and tag
make CONTAINER_TOOL=podman build               # Use podman instead of docker
make TAG=v1.0.0 CONTAINER_TOOL=podman build    # Combine options
```

**Important**: The k8s overlays expect specific image tags:
- Development environment uses `latest` tag (default)
- Production environment requires `prod` tag

### OpenShift Deployment
```bash
# First build and push images with correct tags
make build && make push                     # For development (uses latest tag)
make build-prod && make push-prod           # For production

# Then deploy
make deploy           # Deploy to development
make deploy-prod      # Deploy to production
make undeploy         # Remove development deployment
make undeploy-prod    # Remove production deployment
make kustomize        # Preview dev manifests
make kustomize-prod   # Preview prod manifests
```

## Architecture

### Frontend (React + Vite + PatternFly)
- **UI Framework**: PatternFly React components for enterprise-ready UI
- **TypeScript** for type safety
- **Vite** for fast development and building
- **React Router** for client-side routing
- **Vitest** for unit testing with browser mode support
- **Page Structure**: Pre-built pages (Dashboard, Support, Settings with General/Profile subpages)
- **Routing**: Route configuration in `src/app/routeConfig.tsx` with nested routes support
- **API Communication**: Axios for HTTP requests
- **Proxy Configuration**:
  - Local dev: Vite dev server proxies `/api/` to `http://localhost:8000` (vite.config.ts:30-35)
  - Production: Nginx proxies `/api/` to backend service

### Backend (FastAPI)
- **Python 3.11+** with FastAPI framework
- **Uvicorn** as ASGI server
- **UV Package Manager**: Fast, reliable Python dependency management (replaces pip/poetry)
  - Dependencies in `pyproject.toml`
  - Add packages: `cd backend && uv add <package>`
  - Sync dependencies: `cd backend && uv sync`
- **Database**: PostgreSQL with SQLModel ORM (in development - being migrated from basic template)
  - Container-based PostgreSQL for local development
  - Alembic for database migrations
  - Connection pooling and health checks
- **API Structure**: Versioned routing pattern
  - Main app: `main.py` includes router at `/api`
  - API router: `app/api/router.py` includes v1 at `/api/v1`
  - V1 router: `app/api/routes/v1/router.py` includes utils at `/api/v1/utils`
  - Final endpoint: `/api/v1/utils/health-check` (health.py)
- **CORS**: Configured for `localhost:8080` and `localhost:5173` (main.py:14-20)
- **Testing**: pytest with async support configured in pyproject.toml

### Deployment
- Docker containers for both services
- OpenShift Routes for external access
- Kustomize for environment-specific configuration
- Separate dev and prod overlays
- Quay.io as container registry
- OpenShift Security Context Constraints (SCC) compatible

## Configuration Files

### Environment Variables
- `backend/.env` - Backend configuration (copy from .env.example)
- `frontend/.env` - Frontend configuration (copy from .env.example)

### Key Configuration
- `vite.config.ts` - Vite configuration with proxy to backend
- `scripts/dev-db.sh` - PostgreSQL container management for local development
- `k8s/base/kustomization.yaml` - Base Kubernetes resources
- `k8s/overlays/*/kustomization.yaml` - Environment-specific configs

## API Endpoints

The FastAPI backend provides:
- `GET /` - Root endpoint (main.py:25-27)
- `GET /api/v1/utils/health-check` - Health check endpoint (app/api/routes/v1/utils/health.py)

## Development Workflow

### Initial Setup
1. Install dependencies: `make setup`
2. Start PostgreSQL: `make db-start`
3. Configure environment: `make env-setup` (creates .env files from examples)
4. Start development servers: `make dev`

### Daily Development
1. Start database: `make db-start` (if not already running)
2. Make changes to frontend (React) or backend (FastAPI)
3. Test locally with `make dev`
4. Run tests: `make test`

### Deployment
1. Build everything with `make build`
2. Build and push containers with `make build && make push`
3. Deploy to OpenShift with `make deploy` or `make deploy-prod`

## Common Tasks

### Adding New Dependencies
- **Frontend**: `cd frontend && npm install <package>`
- **Backend**: `cd backend && uv add <package>` (automatically updates pyproject.toml and uv.lock)
  - For dev dependencies: `cd backend && uv add --dev <package>`

### Adding New API Endpoints
1. Create new route file in `backend/app/api/routes/v1/<feature>/`
2. Create router and import into `backend/app/api/routes/v1/router.py`
3. Router will be automatically available at `/api/v1/<feature>/...`

### Adding New Frontend Pages
1. Create component in `frontend/src/app/<PageName>/`
2. Add route to `frontend/src/app/routeConfig.tsx`
3. Route will appear in navigation sidebar if `label` is provided

### Running Single Tests
- **Frontend**: `cd frontend && npm run test -- <test-file-pattern>`
- **Backend**: `cd backend && uv run pytest tests/<test-file>.py`
- **Backend single test**: `cd backend && uv run pytest tests/<file>.py::<test_name> -v`

### Managing the Development Database
- **Start database**: `make db-start`
- **Check status**: `make db-status`
- **View logs**: `make db-logs`
- **Access database shell**: `make db-shell` (connects to psql)
- **Reset database**: `make db-reset` (WARNING: deletes all data)
- **Stop database**: `make db-stop`

### Updating Container Images
- Update image tags in `k8s/base/kustomization.yaml`
- Update tags in overlay files for environment-specific versions

### Customizing for New Projects
- Update image names in kustomization files
- Update registry in Makefile (default: `quay.io/cfchase`)
- Update page titles in `frontend/src/app/routeConfig.tsx` (currently "PatternFly Seed")
- The template provides a foundation with example pages - customize or replace as needed

## Git Commit Guidelines

When creating git commits:
- Use clear, descriptive commit messages
- Follow conventional commit format when appropriate
- Do NOT include any AI assistant attribution or co-authorship
- Keep commit messages focused on the actual changes made