#!/bin/bash

# Deploy application to OpenShift using kustomize
# Usage: ./scripts/deploy.sh [environment] [namespace]

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

echo "Deploying to $ENVIRONMENT environment..."
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

# Create namespace if it doesn't exist
echo "Creating namespace if it doesn't exist..."
oc create namespace "$NAMESPACE" --dry-run=client -o yaml | oc apply -f -

# Apply kustomize configuration
echo "Applying kustomize configuration..."
kustomize build "k8s/overlays/$ENVIRONMENT" | oc apply -f -

echo "Deployment complete!"
echo "You can check the status with:"
echo "  oc get pods -n $NAMESPACE"
echo "  oc get routes -n $NAMESPACE"