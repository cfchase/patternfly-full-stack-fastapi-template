# __PROJECT_TITLE__

A production-ready full-stack application template with React frontend (Vite + PatternFly UI) and FastAPI backend, featuring PostgreSQL database, comprehensive testing, and OpenShift deployment.

## Quick Start

### Prerequisites

- Node.js 24+
- Python 3.11+
- UV (Python package manager) - `pip install uv`
- Docker or Podman

### 1. Use This Template

1. Click **"Use this template"** → **"Create a new repository"** on GitHub
2. Clone your new repository and rename the project:

```bash
git clone https://github.com/YOUR_ORG/my-project.git
cd my-project
make rename
```

This replaces template tokens, installs dependencies, and generates lock files. Required before CI, build, or deploy commands will work.

### 2. Run Locally

```bash
make setup
make db-start && make db-init && make db-seed
make dev
```

Your app is running at http://localhost:8080

### 3. Enable CI

Add secrets to your GitHub repository for automated image builds:

1. Go to Settings → Secrets and variables → Actions
2. Add `QUAY_USERNAME` and `QUAY_PASSWORD`

CI runs tests on every PR. On merge to main, images are built and pushed.

### 4. Deploy

```bash
# Build and push container images
make build && make push

# Deploy to OpenShift/Kubernetes
make deploy
```

## Features

- **Frontend**: React with TypeScript, Vite, and PatternFly UI components
- **Backend**: FastAPI with Python 3.11+, SQLModel ORM, and Alembic migrations
- **Database**: PostgreSQL 15 with container-based local development
- **Testing**: Vitest for unit tests, Playwright for end-to-end tests
- **Containerization**: Docker/Podman with multi-stage builds
- **Deployment**: OpenShift/Kubernetes with Kustomize
- **Developer Experience**: Comprehensive Makefile with 30+ commands

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: PatternFly React components for enterprise-ready UI
- **Routing**: React Router with nested route support
- **API Client**: Axios with TypeScript types
- **Testing**: Vitest for unit tests, Playwright for E2E tests

### Backend
- **Framework**: FastAPI with async support
- **Database ORM**: SQLModel (combines SQLAlchemy and Pydantic)
- **Migrations**: Alembic for database schema versioning
- **Package Manager**: UV for fast, reliable Python dependency management
- **Validation**: Pydantic schemas with automatic OpenAPI documentation
- **Testing**: pytest with async support

### Database
- **Local Development**: PostgreSQL 15 in Docker/Podman container
- **Production**: PostgreSQL with persistent storage in Kubernetes
- **Migrations**: Alembic-managed schema migrations
- **Seeding**: Test data generation scripts for development

## Project Structure

```
├── backend/                    # FastAPI backend
│   ├── main.py                # Main application entry point
│   ├── app/
│   │   ├── api/              # API routes (versioned: /api/v1/...)
│   │   │   ├── deps.py       # Dependency injection (database sessions)
│   │   │   └── routes/       # API endpoints
│   │   ├── core/             # Core configuration
│   │   │   ├── config.py     # Settings and environment variables
│   │   │   └── db.py         # Database connection and engine
│   │   ├── models.py         # SQLModel database models and schemas
│   │   └── alembic/          # Database migrations
│   ├── scripts/              # Utility scripts (seed data, etc.)
│   ├── pyproject.toml        # Python dependencies (UV format)
│   ├── alembic.ini           # Alembic configuration
│   └── Dockerfile            # Backend container image
├── frontend/                  # React frontend
│   ├── src/
│   │   └── app/              # Application components
│   │       ├── Items/        # Item Browser (full CRUD example)
│   │       ├── services/     # API service layer
│   │       └── routeConfig.tsx  # Route configuration
│   ├── e2e/                  # Playwright E2E tests
│   ├── playwright.config.ts  # Playwright configuration
│   ├── package.json          # Node dependencies
│   ├── vite.config.ts        # Vite configuration with API proxy
│   ├── Dockerfile            # Frontend container (nginx-based)
│   └── nginx.conf            # Production nginx configuration
├── k8s/                      # Kubernetes/OpenShift manifests
│   ├── base/                 # Base Kustomize resources
│   └── overlays/             # Environment-specific configurations
│       ├── dev/              # Development environment
│       └── prod/             # Production environment
├── scripts/                  # Automation scripts
│   ├── rename-project.sh    # Project rename script
│   ├── dev-db.sh            # PostgreSQL container management
│   ├── build-images.sh      # Container image building
│   ├── push-images.sh       # Container image pushing
│   └── deploy.sh            # Deployment automation
└── Makefile                  # Comprehensive command reference (30+ commands)
```

## Development Commands

### Database Management

```bash
# Start/Stop Database
make db-start       # Start PostgreSQL container (creates if needed)
make db-stop        # Stop PostgreSQL container
make db-status      # Check if database is running

# Database Operations
make db-init        # Run Alembic migrations to create/update schema
make db-seed        # Populate database with test data
make db-shell       # Open PostgreSQL shell (psql)
make db-logs        # Show PostgreSQL logs
make db-reset       # Remove container and delete all data (destructive!)
```

### Running Development Servers

```bash
make dev                # Run both frontend and backend
make dev-frontend       # Run React dev server (port 8080)
make dev-backend        # Run FastAPI server with auto-reload (port 8000)
```

Access the application:
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Testing

```bash
make test               # Run all tests (frontend + backend)
make test-frontend      # Run lint, type checking, and Vitest tests
make test-backend       # Run pytest tests
make test-e2e           # Run Playwright E2E tests
make test-e2e-ui        # Run E2E tests with Playwright UI (interactive)
```

### Building and Deploying

```bash
# Build container images
make build              # Build frontend and container images (latest tag)
make build-prod         # Build with prod tag for production deployment

# Push to registry
make push               # Push images with latest tag
make push-prod          # Push images with prod tag

# Deploy to OpenShift/Kubernetes
make deploy             # Deploy to development
make deploy-prod        # Deploy to production
make undeploy           # Remove deployment
```

## API Endpoints

**Health and Utils:**
- `GET /` - Root endpoint
- `GET /api/v1/utils/health-check` - Health check with database connectivity

**Items API:**
- `GET /api/v1/items/` - List all items (with pagination)
- `GET /api/v1/items/{id}` - Get item by ID
- `POST /api/v1/items/` - Create new item
- `PUT /api/v1/items/{id}` - Update item
- `DELETE /api/v1/items/{id}` - Delete item

**API Documentation:**
- Interactive docs: http://localhost:8000/docs
- OpenAPI spec: http://localhost:8000/openapi.json

## CI/CD Details

### GitHub Actions Workflow

| Event | Actions |
|-------|---------|
| Pull Request | Run tests (frontend + backend), validate versions |
| Merge to main | Run tests, build and push images with `latest` tag |
| Release published | Build and push images with version tag + `prod` tag |

### Release Workflow

1. Update version: `make bump-version TYPE=patch` (or `minor`/`major`)
2. Commit and push to main
3. Create a GitHub Release with the version tag (e.g., `v1.0.1`)
4. CI automatically builds and pushes images with version and `prod` tags

## Configuration

### Backend Environment Variables

Create `backend/.env` (copy from `backend/.env.example`):

```env
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=app
POSTGRES_PASSWORD=changethis
POSTGRES_DB=app
ENVIRONMENT=local
PROJECT_NAME=__PROJECT_TITLE__
FRONTEND_HOST=http://localhost:8080
```

### Frontend Environment Variables

Create `frontend/.env` (copy from `frontend/.env.example`):

```env
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### Database Connection Issues
```bash
make db-status          # Check if database is running
make db-logs            # Check database logs
make db-reset           # Reset database (removes all data!)
```

### Frontend Not Loading
```bash
make health-backend     # Check if backend is running
```

### E2E Tests Failing
```bash
make db-seed            # Ensure database has test data
make dev-backend        # Ensure backend is running
make test-e2e-headed    # Run with visible browser for debugging
```

## Additional Documentation

- **CLAUDE.md**: Comprehensive developer guide
- **E2E_TESTING.md**: End-to-end testing documentation
- **docs/**: Detailed guides for authentication, deployment, and more

## License

Apache License 2.0
