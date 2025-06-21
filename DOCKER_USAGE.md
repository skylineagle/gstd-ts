# GStreamer Daemon Docker Usage

This Docker container runs the GStreamer Daemon (gstd) with configurable runtime parameters.

## Environment Variables

| Variable           | Default | Description                                 |
| ------------------ | ------- | ------------------------------------------- |
| `GST_DEBUG`        | `1`     | GStreamer debug level (0-9)                 |
| `GSTD_HTTP_PORT`   | `8080`  | HTTP interface port                         |
| `GSTD_UNIX_SOCKET` | `""`    | Unix socket path (required if Unix enabled) |
| `GSTD_ENABLE_HTTP` | `true`  | Enable HTTP interface                       |
| `GSTD_ENABLE_UNIX` | `false` | Enable Unix socket interface                |
| `GSTD_EXTRA_FLAGS` | `""`    | Additional gstd command line flags          |

## Usage Examples

### HTTP Only (Default)

```bash
docker run -p 8080:8080 gstd-ts:latest
```

### HTTP with Custom Port

```bash
docker run -p 9090:9090 \
  -e GSTD_HTTP_PORT=9090 \
  gstd-ts:latest
```

### Unix Socket Only

```bash
docker run -v /tmp/gstd:/tmp \
  -e GSTD_ENABLE_HTTP=false \
  -e GSTD_ENABLE_UNIX=true \
  -e GSTD_UNIX_SOCKET=/tmp/gstd.sock \
  gstd-ts:latest
```

### Both HTTP and Unix Socket

```bash
docker run -p 8080:8080 \
  -v /tmp/gstd:/tmp \
  -e GSTD_ENABLE_HTTP=true \
  -e GSTD_ENABLE_UNIX=true \
  -e GSTD_UNIX_SOCKET=/tmp/gstd.sock \
  gstd-ts:latest
```

### With Extra Flags

```bash
docker run -p 8080:8080 \
  -e GSTD_EXTRA_FLAGS="--verbose --log-level=debug" \
  gstd-ts:latest
```

### High Debug Level

```bash
docker run -p 8080:8080 \
  -e GST_DEBUG=5 \
  gstd-ts:latest
```

## Docker Compose Examples

### HTTP Only

```yaml
services:
  gstd:
    image: gstd-ts:latest
    ports:
      - "8080:8080"
    environment:
      - GSTD_ENABLE_HTTP=true
      - GSTD_ENABLE_UNIX=false
```

### Unix Socket Only

```yaml
services:
  gstd:
    image: gstd-ts:latest
    volumes:
      - gstd-sockets:/tmp
    environment:
      - GSTD_ENABLE_HTTP=false
      - GSTD_ENABLE_UNIX=true
      - GSTD_UNIX_SOCKET=/tmp/gstd.sock

volumes:
  gstd-sockets:
```

### Both Interfaces

```yaml
services:
  gstd:
    image: gstd-ts:latest
    ports:
      - "8080:8080"
    volumes:
      - gstd-sockets:/tmp
    environment:
      - GSTD_ENABLE_HTTP=true
      - GSTD_ENABLE_UNIX=true
      - GSTD_UNIX_SOCKET=/tmp/gstd.sock

volumes:
  gstd-sockets:
```

## Notes

- At least one interface (HTTP or Unix socket) must be enabled
- When using Unix sockets, ensure proper volume mounting
- The container runs as a non-root user for security
- Health checks are performed via HTTP interface (if enabled)
