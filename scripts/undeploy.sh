#!/bin/bash

# Undeploy application from OpenShift using kustomize
# Usage: ./scripts/undeploy.sh [environment] [namespace]

set -e

# Source project configuration if exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
[ -f "$PROJECT_ROOT/project.env" ] && source "$PROJECT_ROOT/project.env"

# Derive namespace from project config or use defaults
NAMESPACE_PREFIX=${NAMESPACE_PREFIX:-${PROJECT_NAME:-patternfly-fastapi}}

ENVIRONMENT=${1:-dev}
NAMESPACE=${2:-${NAMESPACE_PREFIX}-${ENVIRONMENT}}

if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo "Error: Environment must be 'dev' or 'prod'"
    exit 1
fi

echo "Undeploying from $ENVIRONMENT environment..."
echo "Namespace: $NAMESPACE"

# Check if oc is available
if ! command -v oc &> /dev/null; then
    echo "Error: oc (OpenShift CLI) is not installed or not in PATH"
    exit 1
fi

# Check if kustomize is available
if ! command -v kustomize &> /dev/null; then
    echo "Error: kustomize is not installed or not in PATH"
    exit 1
fi

# Check if logged in to OpenShift
if ! oc whoami &> /dev/null; then
    echo "Error: Not logged in to OpenShift. Please run 'oc login' first."
    exit 1
fi

# Delete resources using kustomize
echo "Deleting resources..."
kustomize build "k8s/overlays/$ENVIRONMENT" | oc delete -f - --ignore-not-found=true

echo "Undeploy complete!"
echo "Resources have been removed from namespace: $NAMESPACE"