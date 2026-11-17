#!/bin/sh
# Install the Toonify chores' dependencies once, outside the runs (no network
# during a run). Every run links them into its workspace (lib/toonify.mjs).
#   sh bin/toonify-deps.sh
# Needs python3 3.11+ on PATH and npm.
set -eu
repo=$(cd "$(dirname "$0")/.." && pwd)
deps="$HOME/.cache/derpmeter-lab/toonify"
mkdir -p "$deps/frontend"
rm -rf "$deps/venv"
python3 -m venv "$deps/venv"
"$deps/venv/bin/pip" install -q -r "$repo/fixtures/toonify/backend/requirements.lock"
cp "$repo/fixtures/toonify/frontend/package.json" "$repo/fixtures/toonify/frontend/package-lock.json" "$deps/frontend/"
(cd "$deps/frontend" && npm ci --legacy-peer-deps --no-audit --no-fund)
echo "Toonify dependencies ready in $deps"
