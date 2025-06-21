#!/bin/bash

set -euo pipefail

readonly IMAGE_NAME="gstd-ts"
readonly TAG="latest"

echo "🚀 Building optimized Docker image: $IMAGE_NAME:$TAG"
echo "🔒 Non-root user for security"
echo "⚡ Static linking for smaller binaries"

DOCKER_BUILDKIT=1 docker build \
    --no-cache \
    --compress \
    --rm \
    -t "$IMAGE_NAME:$TAG" \
    .

echo ""
echo "✅ Build completed successfully!"

IMAGE_SIZE=$(docker images "$IMAGE_NAME:$TAG" --format "table {{.Size}}" | tail -n 1)
echo "📊 Image size: $IMAGE_SIZE"

echo ""
echo "🏃 Usage examples:"
echo "  # Run with docker-compose (recommended):"
echo "  docker-compose up"
echo ""
echo "  # Run manually:"
echo "  docker run -p 8080:8080 --cap-add=SYS_ADMIN $IMAGE_NAME:$TAG"
echo ""
echo "  # Run only gstd daemon:"
echo "  docker run -p 8080:8080 --cap-add=SYS_ADMIN $IMAGE_NAME:$TAG gstd-only"
echo ""
echo "  # Run only TypeScript client:"
echo "  docker run $IMAGE_NAME:$TAG client-only"
echo ""
echo "  # Check image layers:"
echo "  docker history $IMAGE_NAME:$TAG" 