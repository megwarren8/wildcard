#!/usr/bin/env bash
# WILDCARD — double-click to play. Starts a tiny local server and opens your browser.
# cd to this script's own folder, so moving or renaming the project never breaks it.
cd "$(dirname "$0")" || { echo "Project folder not found."; read -r -p "Press Return to close."; exit 1; }

clear
echo "WILDCARD — Ice-Breaker Slot Machine"
echo "==================================="
echo ""

resolve_port() {
  local want="$1" appdir="$2" marker="${3:-}" probe="${4:-/}" pid cwd p mine=""
  pid="$(lsof -nP -iTCP:"$want" -sTCP:LISTEN -t 2>/dev/null | head -n1)"
  if [ -n "$pid" ]; then
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n1)"
    if [ "${cwd%/}" = "${appdir%/}" ]; then mine=1
    elif [ -n "$marker" ] && curl -fs "http://127.0.0.1:${want}${probe}" 2>/dev/null | grep -q "$marker"; then mine=1
    fi
    if [ -n "$mine" ]; then
      echo "Already running — opening your browser."
      open "http://127.0.0.1:${want}/"
      echo ""
      read -r -p "Press Return to close this window."
      exit 0
    fi
    echo "Port ${want} is in use by a different app."
    for p in $(seq $((want+1)) $((want+30))); do
      if ! lsof -nP -iTCP:"$p" -sTCP:LISTEN -t >/dev/null 2>&1; then
        PORT="$p"; echo "Using a free port instead: ${PORT}"; return 0
      fi
    done
    echo "Couldn't find a free port near ${want}. Close the other app and try again."
    read -r -p "Press Return to close."; exit 1
  fi
  PORT="$want"
}

resolve_port 8000 "$PWD" "WILDCARD" "/"
URL="http://127.0.0.1:${PORT}/"

# Open the browser once OUR server answers (match the marker, not just any 200).
( for _ in $(seq 1 40); do
    if curl -fs "${URL}" 2>/dev/null | grep -q "WILDCARD"; then
      open "${URL}"
      break
    fi
    sleep 0.5
  done ) &

echo "Starting WILDCARD at ${URL}"
echo "Your browser will open in a moment."
echo ""
echo "KEEP THIS WINDOW OPEN while you play."
echo "To stop: close this window, or press Control-C."
echo ""
exec python3 -m http.server "${PORT}" --bind 127.0.0.1
