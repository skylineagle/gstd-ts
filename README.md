# gstd-ts

TypeScript client for the RidgeRun GStreamer Daemon HTTP API.

## 🚀 Quick Start

### Using Pre-built Docker Images

```bash
# Pull and run the latest image
docker run -p 8080:8080 --cap-add=SYS_ADMIN ghcr.io/OWNER/gstd:latest

# Or use the smaller Alpine variant
docker run -p 8080:8080 --cap-add=SYS_ADMIN ghcr.io/OWNER/gstd:alpine

# Using docker-compose (recommended)
docker-compose up
```

### Building Locally

```bash
# Build the optimized image
./build.sh

# Run with docker-compose
docker-compose up
```

## 📦 Docker Images

We provide two optimized Docker variants:

### Standard Image (`latest`)

- **Base**: Alpine Linux 3.19
- **Size**: ~300-400MB
- **Platforms**: linux/amd64, linux/arm64
- **Use case**: General purpose, full feature set

### Alpine Variant (`alpine`)

- **Base**: Alpine Linux 3.19 (ultra-optimized)
- **Size**: ~200-300MB
- **Platforms**: linux/amd64, linux/arm64
- **Use case**: Minimal footprint, production deployments

Both images include:

- ✅ GStreamer Daemon (gstd) built from source
- ✅ Complete GStreamer plugin suite
- ✅ Bun runtime for TypeScript
- ✅ Non-root user security
- ✅ Health checks and monitoring
- ✅ Multi-architecture support

## 🔧 Usage Modes

The Docker container supports multiple execution modes:

```bash
# Full mode (gstd + TypeScript client)
docker run -p 8080:8080 --cap-add=SYS_ADMIN ghcr.io/OWNER/gstd:latest

# gstd daemon only
docker run -p 8080:8080 --cap-add=SYS_ADMIN ghcr.io/OWNER/gstd:latest gstd-only

# TypeScript client only
docker run ghcr.io/OWNER/gstd:latest client-only
```

## 🔒 Security Features

- **Non-root execution**: Runs as `gstd` user (UID 1001)
- **Minimal privileges**: Uses `--cap-add=SYS_ADMIN` instead of `--privileged`
- **Read-only filesystem**: Container root filesystem is read-only
- **Security scanning**: Images are scanned for vulnerabilities
- **SBOM included**: Software Bill of Materials for transparency

## 🏗️ GitHub Actions Workflows

### Automated Build & Publish (`docker-build.yml`)

- **Triggers**: Push to main/master, PRs, manual dispatch
- **Features**:
  - Multi-platform builds (amd64, arm64)
  - Publishes to GitHub Container Registry
  - Builds both standard and Alpine variants
  - Security scanning with Trivy
  - SBOM generation
  - Build caching for faster builds

### Release Workflow (`release.yml`)

- **Triggers**: GitHub releases, manual dispatch
- **Features**:
  - Semantic versioning
  - Release notes generation
  - Comprehensive security scanning
  - Provenance attestation
  - Release artifact uploads
  - Docker Hub description updates

### Testing Workflow (`test-docker.yml`)

- **Triggers**: PRs affecting Docker files, manual dispatch
- **Features**:
  - Multi-variant testing (standard + Alpine)
  - Functionality testing (gstd startup, API endpoints)
  - Security validation (non-root, read-only filesystem)
  - Docker Compose validation
  - Automated test reporting

## 🌐 Registry Information

Images are published to GitHub Container Registry:

- **Registry**: `ghcr.io`
- **Repository**: `ghcr.io/OWNER/gstd`
- **Tags**: `latest`, `alpine`, version tags (e.g., `v1.0.0`)

## 📊 Development

### Local Development

```bash
# Install dependencies
bun install

# Generate API types
bun run generate
```

### Building Images

```bash
# Build standard image
docker build -t gstd:latest .

# Build Alpine variant
docker build -f Dockerfile.alpine -t gstd:alpine .

# Build with script (includes optimizations)
./build.sh
```

## 🔧 Configuration

Environment variables:

- `GSTD_HTTP_PORT`: HTTP API port (default: 8080)
- `GST_DEBUG`: GStreamer debug level (default: 1)
- `NODE_ENV`: Node.js environment (default: production)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass (`docker-compose up` should work)
5. Submit a pull request

The GitHub Actions will automatically test your changes and provide feedback.

## 📄 License

[Your License Here]
