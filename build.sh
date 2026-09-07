#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v go &>/dev/null; then
    echo "Go is required. Install: sudo apt install golang-go"
    exit 1
fi

echo "Removing previous dist..."
rm -rf dist

echo "Building web app..."
npm run build

if [ ! -f "dist/index.html" ]; then
    echo "Web app build failed: dist/index.html not found"
    exit 1
fi

echo "Building static executable..."
rm -rf release
mkdir -p release
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o release/geojson-map-app .

echo ""
echo "Done! Static executable: release/geojson-map-app"
echo "Copy to any Linux x86_64 and run: ./geojson-map-app"