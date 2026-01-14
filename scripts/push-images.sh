#!/bin/bash

# Push container images to registry
# Usage: ./scripts/push-images.sh [tag] [registry] [container-tool]
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

log_info "Pushing images with tag: $TAG"
log_info "Registry: $REGISTRY"
log_info "Container tool: $CONTAINER_TOOL"

# Push backend image
log_step "Pushing backend image..."
$CONTAINER_TOOL push "${REGISTRY}/${PROJECT_NAME}-backend:${TAG}"

# Push frontend image
log_step "Pushing frontend image..."
$CONTAINER_TOOL push "${REGISTRY}/${PROJECT_NAME}-frontend:${TAG}"

log_info "Images pushed successfully!"
log_info "Backend: ${REGISTRY}/${PROJECT_NAME}-backend:${TAG}"
log_info "Frontend: ${REGISTRY}/${PROJECT_NAME}-frontend:${TAG}"
