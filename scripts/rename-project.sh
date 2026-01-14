#!/bin/bash

# Rename Project Script
# Replaces template tokens with your project values
#
# Usage: ./scripts/rename-project.sh [-y] [project-name] [registry]
# Example: ./scripts/rename-project.sh my-cool-app quay.io/myorg
# Example: ./scripts/rename-project.sh -y my-cool-app quay.io/myorg  # Non-interactive
#
# Tokens replaced:
#   __REGISTRY__       -> Container registry (e.g., quay.io/myorg)
#   __PROJECT_NAME__   -> Project name in kebab-case (e.g., my-cool-app)
#   __PROJECT_TITLE__  -> Project title (e.g., My Cool App)
#   __DB_NAME__        -> Database name with underscores (e.g., my_cool_app)
#
# Template markers processed:
#   __TEMPLATE_ONLY_START__ ... __TEMPLATE_ONLY_END__  -> DELETE entire block

set -e

# ========================================
# Script Directory Detection
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source common utilities
source "$SCRIPT_DIR/lib/common.sh"

# Change to project root
cd "$PROJECT_ROOT"

# ========================================
# Registry Detection Functions
# ========================================

detect_container_registry() {
    local container_tool="$1"
    local registries=("quay.io" "docker.io")

    # Method 1: Try podman login --get-login
    if [[ "$container_tool" == "podman" ]] && command -v podman &> /dev/null; then
        for registry in "${registries[@]}"; do
            local username
            username=$(podman login --get-login "$registry" 2>/dev/null || echo "")
            if [[ -n "$username" ]] && [[ "$username" != "Error:"* ]]; then
                echo "${registry}/${username}"
                return 0
            fi
        done
    fi

    # Method 2: Try docker credential helper
    if [[ -f "${HOME}/.docker/config.json" ]]; then
        local creds_store
        creds_store=$(grep -o '"credsStore"[[:space:]]*:[[:space:]]*"[^"]*"' "${HOME}/.docker/config.json" 2>/dev/null | sed -E 's/.*"([^"]+)"$/\1/' || echo "")

        if [[ -n "$creds_store" ]]; then
            local helper="docker-credential-${creds_store}"
            if command -v "$helper" &> /dev/null; then
                for registry in "${registries[@]}"; do
                    local cred_output
                    cred_output=$(echo "$registry" | "$helper" get 2>/dev/null || echo "")
                    if [[ -n "$cred_output" ]] && [[ "$cred_output" != *"credentials not found"* ]]; then
                        local username
                        username=$(echo "$cred_output" | grep -o '"Username"[[:space:]]*:[[:space:]]*"[^"]*"' | sed -E 's/.*"([^"]+)"$/\1/' || echo "")
                        if [[ -n "$username" ]]; then
                            echo "${registry}/${username}"
                            return 0
                        fi
                    fi
                done
            fi
        fi
    fi

    echo ""
    return 1
}

detect_project_name() {
    local name=""

    # Try git remote URL
    if command -v git &> /dev/null && git rev-parse --git-dir &> /dev/null; then
        local remote_url
        remote_url=$(git remote get-url origin 2>/dev/null || echo "")
        if [[ -n "$remote_url" ]]; then
            name=$(echo "$remote_url" | sed -E 's|.*[/:]([^/]+)\.git$|\1|' | sed -E 's|.*[/:]([^/]+)$|\1|')
        fi
    fi

    # Fall back to directory name
    if [[ -z "$name" ]]; then
        name=$(basename "$PROJECT_ROOT")
    fi

    # Normalize: lowercase, hyphens instead of underscores
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/_/-/g'
}

# ========================================
# Input Handling
# ========================================

# Parse flags and positional arguments
YES_FLAG=false
NEW_PROJECT_NAME=""
NEW_REGISTRY=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -y|--yes)
            YES_FLAG=true
            shift
            ;;
        -*)
            log_error "Unknown option: $1"
            echo "Usage: $0 [-y|--yes] [project-name] [registry]"
            exit 1
            ;;
        *)
            # Positional argument
            if [[ -z "$NEW_PROJECT_NAME" ]]; then
                NEW_PROJECT_NAME="$1"
            elif [[ -z "$NEW_REGISTRY" ]]; then
                NEW_REGISTRY="$1"
            fi
            shift
            ;;
    esac
done

# Detect container tool
CONTAINER_TOOL=$(autodetect_container_tool)
log_info "Detected container tool: $CONTAINER_TOOL"

# Auto-detect project name if not provided
if [[ -z "$NEW_PROJECT_NAME" ]]; then
    NEW_PROJECT_NAME=$(detect_project_name)
    if [[ -n "$NEW_PROJECT_NAME" ]]; then
        log_info "Auto-detected project name: $NEW_PROJECT_NAME"
    else
        log_error "Could not auto-detect project name. Please provide it as an argument."
        echo ""
        echo "Usage: $0 <project-name> [registry]"
        exit 1
    fi
fi

# Auto-detect registry if not provided
if [[ -z "$NEW_REGISTRY" ]]; then
    NEW_REGISTRY=$(detect_container_registry "$CONTAINER_TOOL")
    if [[ -n "$NEW_REGISTRY" ]]; then
        log_info "Auto-detected registry: $NEW_REGISTRY"
    else
        NEW_REGISTRY="quay.io/myorg"
        log_warn "Could not auto-detect registry. Using placeholder: $NEW_REGISTRY"
        log_warn "Update manually or run: make rename REGISTRY=quay.io/yourorg"
    fi
fi

# ========================================
# Validation
# ========================================

validate_project_name() {
    local name="$1"

    if [[ ${#name} -lt 2 ]] || [[ ${#name} -gt 63 ]]; then
        log_error "Project name must be 2-63 characters long"
        exit 1
    fi

    if [[ ! "$name" =~ ^[a-z][a-z0-9-]*[a-z0-9]$ ]]; then
        log_error "Project name must start with letter, end with letter/number, contain only lowercase letters, numbers, and hyphens"
        exit 1
    fi

    if [[ "$name" == *--* ]]; then
        log_error "Project name cannot contain consecutive hyphens"
        exit 1
    fi
}

validate_registry() {
    local registry="$1"
    if [[ ! "$registry" =~ ^[a-z0-9][a-z0-9.-]+/[a-z0-9._/-]+$ ]]; then
        log_error "Invalid registry format: $registry"
        log_error "Expected: registry.io/namespace (e.g., quay.io/myorg)"
        exit 1
    fi
}

validate_project_name "$NEW_PROJECT_NAME"
validate_registry "$NEW_REGISTRY"

# ========================================
# Token Values
# ========================================

# Convert to Title Case: my-cool-app -> My Cool App
to_title_case() {
    echo "$1" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1'
}

# Convert to database name: my-cool-app -> my_cool_app
to_db_name() {
    echo "$1" | sed 's/-/_/g'
}

NEW_PROJECT_TITLE=$(to_title_case "$NEW_PROJECT_NAME")
NEW_DB_NAME=$(to_db_name "$NEW_PROJECT_NAME")

# ========================================
# Display Configuration
# ========================================

echo ""
log_info "Project Rename Configuration"
echo "======================================"
echo "  __REGISTRY__       -> $NEW_REGISTRY"
echo "  __PROJECT_NAME__   -> $NEW_PROJECT_NAME"
echo "  __PROJECT_TITLE__  -> $NEW_PROJECT_TITLE"
echo "  __DB_NAME__        -> $NEW_DB_NAME"
echo ""
echo "  Backend Image:  ${NEW_REGISTRY}/${NEW_PROJECT_NAME}-backend"
echo "  Frontend Image: ${NEW_REGISTRY}/${NEW_PROJECT_NAME}-frontend"
echo "  Dev Namespace:  ${NEW_PROJECT_NAME}-dev"
echo "  Prod Namespace: ${NEW_PROJECT_NAME}-prod"
echo "======================================"
echo ""

# Confirm before proceeding (skip if -y flag was passed)
if [[ "$YES_FLAG" != "true" ]]; then
    read -p "Proceed with rename? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "Cancelled by user"
        exit 0
    fi
fi

# ========================================
# Token Replacement
# ========================================

# Files to process for token replacement (relative to project root)
FILES_TO_UPDATE=(
    # Build and CI
    "Makefile"
    "scripts/build-images.sh"
    "scripts/push-images.sh"
    "scripts/deploy.sh"
    "scripts/undeploy.sh"
    "scripts/dev-db.sh"

    # Kubernetes
    "k8s/base/kustomization.yaml"
    "k8s/base/deployment.yaml"
    "k8s/overlays/dev/kustomization.yaml"
    "k8s/overlays/prod/kustomization.yaml"
    "k8s/postgres/database/in-cluster/postgres-secret.yaml"

    # Backend
    "backend/pyproject.toml"
    "backend/.env.example"
    "backend/app/core/config.py"

    # Frontend
    "frontend/package.json"
    "frontend/index.html"
    "package.json"

    # Documentation
    "README.md"
    "CLAUDE.md"
    "docs/DEPLOYMENT.md"
    "docs/DEVELOPMENT.md"
)

# Files with template/derived markers to process
FILES_WITH_MARKERS=(
    ".github/workflows/ci.yml"
)

FILES_UPDATED=()

log_step "Replacing tokens in template files..."

for file in "${FILES_TO_UPDATE[@]}"; do
    if [[ -f "$file" ]]; then
        # Check if file contains any tokens
        if grep -q "__REGISTRY__\|__PROJECT_NAME__\|__PROJECT_TITLE__\|__DB_NAME__" "$file" 2>/dev/null; then
            sed_inplace "s|__REGISTRY__|${NEW_REGISTRY}|g" "$file"
            sed_inplace "s|__PROJECT_NAME__|${NEW_PROJECT_NAME}|g" "$file"
            sed_inplace "s|__PROJECT_TITLE__|${NEW_PROJECT_TITLE}|g" "$file"
            sed_inplace "s|__DB_NAME__|${NEW_DB_NAME}|g" "$file"
            FILES_UPDATED+=("$file")
        fi
    fi
done

# ========================================
# Template Marker Processing
# ========================================
# __TEMPLATE_ONLY_START__ ... __TEMPLATE_ONLY_END__ -> DELETE entire block

log_step "Processing template markers..."

for file in "${FILES_WITH_MARKERS[@]}"; do
    if [[ -f "$file" ]]; then
        # Delete __TEMPLATE_ONLY__ blocks (including markers and content)
        if grep -q "__TEMPLATE_ONLY_START__" "$file" 2>/dev/null; then
            # Use sed to delete from START to END (inclusive)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' '/__TEMPLATE_ONLY_START__/,/__TEMPLATE_ONLY_END__/d' "$file"
            else
                sed -i '/__TEMPLATE_ONLY_START__/,/__TEMPLATE_ONLY_END__/d' "$file"
            fi
            FILES_UPDATED+=("$file")
        fi
    fi
done

# ========================================
# Install Dependencies (generates lock files)
# ========================================

log_step "Installing dependencies and generating lock files..."
echo ""

# Install frontend dependencies
log_info "Installing frontend dependencies..."
(cd frontend && npm install) || {
    log_error "Frontend install failed"
    exit 1
}

# Install backend dependencies
log_info "Installing backend dependencies..."
(cd backend && uv sync --extra dev) || {
    log_error "Backend install failed"
    exit 1
}

echo ""
log_info "Dependencies installed and lock files generated."

# ========================================
# Summary
# ========================================

echo ""
log_info "======================================"
log_info "Project rename complete!"
log_info "======================================"
echo ""

if [[ ${#FILES_UPDATED[@]} -gt 0 ]]; then
    echo "Files updated:"
    for file in "${FILES_UPDATED[@]}"; do
        echo "  - $file"
    done
fi

echo ""
echo "Next steps:"
echo "  1. Start the database and run the app:"
echo "     make db-start && make db-init && make db-seed && make dev"
echo ""
echo "  2. Set up CI secrets in your GitHub repository:"
echo "     Go to Settings → Secrets and variables → Actions"
echo "     Add these repository secrets:"
echo "       - QUAY_USERNAME: Your quay.io username"
echo "       - QUAY_PASSWORD: Your quay.io password or robot token"
echo ""

# Prompt to commit changes (skip if -y flag or no files updated)
if [[ "$YES_FLAG" != "true" ]] && [[ ${#FILES_UPDATED[@]} -gt 0 ]]; then
    echo ""
    read -p "Would you like to commit these changes now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_step "Committing changes..."
        git add -A
        git commit -m "chore: rename project to ${NEW_PROJECT_NAME}"
        log_info "Changes committed successfully!"
    else
        echo ""
        echo "To commit later, run:"
        echo "  git add -A && git commit -m \"chore: rename project to ${NEW_PROJECT_NAME}\""
    fi
else
    echo "To commit the changes, run:"
    echo "  git add -A && git commit -m \"chore: rename project to ${NEW_PROJECT_NAME}\""
fi
echo ""
