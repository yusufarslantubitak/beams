#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Removing previous dist and release..."
rm -rf dist release
mkdir -p release

echo "Building web app..."
pnpm run build

if [ ! -f "dist/index.html" ]; then
    echo "Web app build failed: dist/index.html not found"
    exit 1
fi

echo "Building static executable..."

if command -v docker &>/dev/null && docker info &>/dev/null; then
    if ! docker image inspect golang:1.25-alpine &>/dev/null; then
        if [ -f "golang-1.25-alpine.tar" ]; then
            echo "Loading golang:1.25-alpine from archive..."
            docker load -i golang-1.25-alpine.tar
        fi
    fi
    echo "Using Docker (golang:1.25-alpine, offline-ready)..."
    docker run --pull=never --rm \
        --user "$(id -u):$(id -g)" \
        -v "$SCRIPT_DIR:/app" \
        -w /app \
        -e CGO_ENABLED=0 \
        -e GOOS=linux \
        -e GOARCH=amd64 \
        -e GOCACHE=/tmp/.cache \
        golang:1.25-alpine \
        go build -ldflags="-s -w" -o release/geojson-map-app .
elif command -v go &>/dev/null; then
    echo "Docker not available, falling back to host Go..."
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o release/geojson-map-app .
else
    echo "Error: Neither Docker nor Go is available on the system."
    echo "Please start Docker Desktop or install Go (golang-go)."
    exit 1
fi

echo ""
echo "Done! Static executable: release/geojson-map-app"
echo "Copy to any Linux x86_64 and run: ./geojson-map-app"