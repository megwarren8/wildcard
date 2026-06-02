#!/usr/bin/env bash
# Serve WILDCARD locally. ES modules + fetch() need http(s), not file://.
set -euo pipefail
cd "$(dirname "$0")"
PORT="${1:-8000}"
echo "WILDCARD → http://localhost:${PORT}"
echo "(Ctrl-C to stop)"
exec python3 -m http.server "$PORT"
