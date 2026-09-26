#!/bin/sh
# Run a named sandbox with the local v3 kit attached.
# Usage: ./run.sh [sandbox-name] [agent] [workspace]
set -e
NAME="${1:-exa-current}"
AGENT="${2:-claude}"
WORKSPACE="${3:-.}"
exec sbx run --name "$NAME" --kit "$PWD/exa.yaml" "$AGENT" "$WORKSPACE"
