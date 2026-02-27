#!/bin/bash
# Build the GeoJSON Map App as a fully static executable for Ubuntu
# Run this script on Ubuntu (or WSL) after building the web app.
# Requires: Go (no Python/PyInstaller needed)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Ensure dist exists (build web app first)
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "Build the web app first: npm run build"
    exit 1
fi

# 2. Check for Go
if ! command -v go &>/dev/null; then
    echo "Go is required. Install: sudo apt install golang-go"
    exit 1
fi

# 3. Build static executable (CGO_ENABLED=0 = no libc, fully static)
echo "Building static executable..."
mkdir -p release
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o release/geojson-map-app .

echo ""
echo "Done! Static executable: release/geojson-map-app"
echo "Copy to any Linux x86_64 and run: ./geojson-map-app"
