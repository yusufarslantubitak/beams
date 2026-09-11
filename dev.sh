#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Starting GeoJSON Viewer Dev Environment (Offline-Ready) ==="

# Check if Docker is available
if ! command -v docker &>/dev/null || ! docker info &>/dev/null; then
    echo "Error: Docker is not running or not installed."
    echo "Please start Docker Desktop."
    exit 1
fi

# Check if beams-dev image exists, or load it from archive
if ! docker image inspect beams-dev:latest &>/dev/null; then
    if [ -f "beams-dev.tar" ]; then
        echo "Loading beams-dev:latest from beams-dev.tar..."
        docker load -i beams-dev.tar
    elif [ -f "Dockerfile.dev" ]; then
        echo "Building beams-dev:latest from Dockerfile.dev..."
        docker build -f Dockerfile.dev -t beams-dev:latest .
    else
        echo "Error: Neither beams-dev:latest image, beams-dev.tar, nor Dockerfile.dev found."
        exit 1
    fi
fi

echo ""
echo "Starting Dev Server with Hot Reload..."
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8006"
echo "Press Ctrl+C to stop."
echo ""

# Clean up any leftover container with the same name
docker rm -f beams-dev &>/dev/null || true

docker run --rm -it \
    --name beams-dev \
    -p 5173:5173 \
    -p 8006:8006 \
    -v "$SCRIPT_DIR:/app" \
    -v /app/node_modules \
    beams-dev:latest
