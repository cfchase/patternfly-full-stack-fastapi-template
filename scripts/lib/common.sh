#!/bin/bash
# Common utilities for development scripts
# Source this file: source "$(dirname "$0")/lib/common.sh"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_debug() {
    if [ "${DEBUG:-false}" = "true" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Get the directory where this script is located
COMMON_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Auto-detect container tool using the shared detection script
autodetect_container_tool() {
    "$COMMON_SCRIPT_DIR/detect-container-tool.sh"
}

# Initialize container tool with priority:
# 1. First argument (if provided)
# 2. Environment variable CONTAINER_TOOL
# 3. Auto-detect using autodetect_container_tool
#
# Usage: init_container_tool [container_tool_arg]
init_container_tool() {
    local arg="${1:-}"

    # Priority 1: passed argument
    if [ -n "$arg" ]; then
        CONTAINER_TOOL="$arg"
        log_debug "Using CONTAINER_TOOL from argument: $CONTAINER_TOOL"
    # Priority 2: environment variable (already set)
    elif [ -n "$CONTAINER_TOOL" ]; then
        log_debug "Using CONTAINER_TOOL from environment: $CONTAINER_TOOL"
    # Priority 3: auto-detect
    else
        CONTAINER_TOOL=$(autodetect_container_tool) || return 1
        log_debug "Auto-detected container tool: $CONTAINER_TOOL"
    fi

    export CONTAINER_TOOL

    # Validate the container tool
    if [[ "$CONTAINER_TOOL" != "podman" && "$CONTAINER_TOOL" != "docker" ]]; then
        log_error "CONTAINER_TOOL must be either 'podman' or 'docker', got: $CONTAINER_TOOL"
        return 1
    fi

    if ! command -v "$CONTAINER_TOOL" &> /dev/null; then
        log_error "$CONTAINER_TOOL is not installed or not in PATH"
        return 1
    fi

    log_debug "Container tool initialized: $CONTAINER_TOOL"
    return 0
}

# Check if a container exists (running or stopped)
container_exists() {
    local name="$1"
    $CONTAINER_TOOL ps -a --format '{{.Names}}' | grep -q "^${name}$"
}

# Check if a container is running
container_running() {
    local name="$1"
    $CONTAINER_TOOL ps --format '{{.Names}}' | grep -q "^${name}$"
}

# Wait for a container to be healthy
wait_for_healthy() {
    local name="$1"
    local timeout="${2:-30}"
    local interval="${3:-1}"

    log_info "Waiting for $name to be healthy (timeout: ${timeout}s)..."

    for ((i=0; i<timeout; i+=interval)); do
        local health=$($CONTAINER_TOOL inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo "none")
        if [ "$health" = "healthy" ]; then
            log_info "$name is healthy"
            return 0
        fi
        sleep "$interval"
    done

    log_error "$name failed to become healthy within ${timeout}s"
    return 1
}

# Platform-specific sed in-place editing
# macOS sed requires '' after -i, Linux does not
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed_inplace() { sed -i '' "$@"; }
else
    sed_inplace() { sed -i "$@"; }
fi
