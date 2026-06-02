#!/usr/bin/env bash
# WILDCARD — double-click to play. Starts a tiny local server and opens your browser.
# cd to this script's own folder, so moving or renaming the project never breaks it.
cd "$(dirname "$0")" || { echo "Project folder not found."; read -r -p "Press Return to close."; exit 1; }

clear
echo "WILDCARD — Ice-Breaker Slot Machine"
echo "==================================="
echo ""

PORT=8000
URL="http://127.0.0.1:${PORT}/"

# If it's already running, just open the browser and bow out.
if curl -s "${URL}index.html" >/dev/null 2>&1; then
  echo "Already running — opening your browser."
  open "${URL}"
  echo ""
  read -r -p "Press Return to close this window."
  exit 0
fi

# Open the browser once the server starts answering.
( for _ in $(seq 1 40); do
    if curl -s "${URL}index.html" >/dev/null 2>&1; then
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
