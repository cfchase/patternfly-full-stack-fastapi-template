#!/bin/bash

# Update Kubernetes manifests with project configuration
# This script replaces hardcoded image names and namespaces with values from project.env
#
# Usage: ./scripts/update-k8s-images.sh
#
# Requires: project.env file in project root (run setup-project.sh first)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for project.env
if [ ! -f "$PROJECT_ROOT/project.env" ]; then
    log_error "project.env not found. Run setup-project.sh first."
    exit 1
fi

# Source configuration
source "$PROJECT_ROOT/project.env"

# Default values (what we're replacing FROM)
OLD_REGISTRY="quay.io/cfchase"
OLD_PROJECT="pf-full-stack-fastapi"
OLD_NAMESPACE_PREFIX="patternfly-fastapi"
OLD_APP_LABEL="patternfly-fastapi-template"

# New values (what we're replacing TO)
NEW_BACKEND_IMAGE="${REGISTRY}/${PROJECT_NAME}-backend"
NEW_FRONTEND_IMAGE="${REGISTRY}/${PROJECT_NAME}-frontend"
NEW_NAMESPACE_PREFIX="${NAMESPACE_PREFIX:-$PROJECT_NAME}"
NEW_APP_LABEL="${PROJECT_NAME}"

log_info "Updating Kubernetes manifests..."
echo ""
echo "  Old backend image: ${OLD_REGISTRY}/${OLD_PROJECT}-backend"
echo "  New backend image: ${NEW_BACKEND_IMAGE}"
echo ""
echo "  Old frontend image: ${OLD_REGISTRY}/${OLD_PROJECT}-frontend"
echo "  New frontend image: ${NEW_FRONTEND_IMAGE}"
echo ""
echo "  Old namespace prefix: ${OLD_NAMESPACE_PREFIX}"
echo "  New namespace prefix: ${NEW_NAMESPACE_PREFIX}"
echo ""

# Function to update a file with sed (macOS compatible)
update_file() {
    local file="$1"
    local old_backend="${OLD_REGISTRY}/${OLD_PROJECT}-backend"
    local old_frontend="${OLD_REGISTRY}/${OLD_PROJECT}-frontend"

    if [ -f "$file" ]; then
        # Create backup and perform replacements
        sed -i.bak \
            -e "s|${old_backend}|${NEW_BACKEND_IMAGE}|g" \
            -e "s|${old_frontend}|${NEW_FRONTEND_IMAGE}|g" \
            "$file"
        rm -f "${file}.bak"
        log_info "Updated: $file"
    else
        log_warn "File not found: $file"
    fi
}

# Function to update namespace in a file
update_namespace() {
    local file="$1"

    if [ -f "$file" ]; then
        sed -i.bak \
            -e "s|namespace: ${OLD_NAMESPACE_PREFIX}-dev|namespace: ${NEW_NAMESPACE_PREFIX}-dev|g" \
            -e "s|namespace: ${OLD_NAMESPACE_PREFIX}-prod|namespace: ${NEW_NAMESPACE_PREFIX}-prod|g" \
            "$file"
        rm -f "${file}.bak"
    fi
}

# Function to update app label in a file
update_app_label() {
    local file="$1"

    if [ -f "$file" ]; then
        sed -i.bak \
            -e "s|app.kubernetes.io/name: ${OLD_APP_LABEL}|app.kubernetes.io/name: ${NEW_APP_LABEL}|g" \
            "$file"
        rm -f "${file}.bak"
    fi
}

# Update k8s/base files
update_file "$PROJECT_ROOT/k8s/base/deployment.yaml"
update_file "$PROJECT_ROOT/k8s/base/kustomization.yaml"
update_app_label "$PROJECT_ROOT/k8s/base/kustomization.yaml"

# Update dev overlay
update_file "$PROJECT_ROOT/k8s/overlays/dev/kustomization.yaml"
update_namespace "$PROJECT_ROOT/k8s/overlays/dev/kustomization.yaml"

# Update prod overlay
update_file "$PROJECT_ROOT/k8s/overlays/prod/kustomization.yaml"
update_namespace "$PROJECT_ROOT/k8s/overlays/prod/kustomization.yaml"

echo ""
log_info "Kubernetes manifests updated successfully!"
echo ""
echo "Verify changes with:"
echo "  kustomize build k8s/overlays/dev | grep -E 'image:|namespace:'"
echo ""
