#!/bin/bash

# Build container images for registry
# Usage: ./scripts/build-images.sh [tag] [registry] [container-tool]
# Environment variables:
#   CONTAINER_TOOL: Container tool to use (docker or podman). Auto-detected if not set.

set -e

# Source common utilities (logging, container tool detection)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Default values
TAG=${1:-latest}
REGISTRY=${2:-__REGISTRY__}
PROJECT_NAME="__PROJECT_NAME__"

# Initialize container tool (uses common.sh detection with optional override from arg/env)
init_container_tool "${3:-}" || exit 1

log_info "Building images with tag: $TAG"
log_info "Registry: $REGISTRY"
log_info "Container tool: $CONTAINER_TOOL"

# Build backend image
log_step "Building backend image..."
$CONTAINER_TOOL build --platform linux/amd64 -t "${REGISTRY}/${PROJECT_NAME}-backend:${TAG}" ./backend

# Build frontend image
log_step "Building frontend image..."
$CONTAINER_TOOL build --platform linux/amd64 -t "${REGISTRY}/${PROJECT_NAME}-frontend:${TAG}" ./frontend

log_info "Images built successfully!"
log_info "Backend: ${REGISTRY}/${PROJECT_NAME}-backend:${TAG}"
log_info "Frontend: ${REGISTRY}/${PROJECT_NAME}-frontend:${TAG}"