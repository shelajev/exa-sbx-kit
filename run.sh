#!/usr/bin/env bash
# Usage: ./run.sh [sandbox-name] [agent] [workspace]
set -euo pipefail
main() {
  local kit_dir
  kit_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  exec sbx run --name "${1:-exa-current}" --kit "$kit_dir" "${2:-claude}" "${3:-.}"
}
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
