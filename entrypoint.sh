#!/bin/bash

set -euo pipefail

readonly GSTD_HTTP_PORT=${GSTD_HTTP_PORT:-8080}
readonly GST_DEBUG=${GST_DEBUG:-1}

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >&2
}

log "Starting GStreamer Daemon on port $GSTD_HTTP_PORT"
log "GST_DEBUG level: $GST_DEBUG"

case "${1:-}" in
    "gstd-only")
        log "Starting gstd daemon only..."
        exec gstd -e --http-port="$GSTD_HTTP_PORT"
        ;;
    "client-only")
        log "Starting TypeScript client only..."
        exec bun run example.ts
        ;;
    *)
        log "Starting gstd daemon and TypeScript client..."
        gstd -e --http-port="$GSTD_HTTP_PORT" &
        readonly GSTD_PID=$!
        
        sleep 3
        
        if ! kill -0 "$GSTD_PID" 2>/dev/null; then
            log "ERROR: gstd failed to start"
            exit 1
        fi
        
        log "gstd started successfully (PID: $GSTD_PID)"
        
        trap 'kill "$GSTD_PID" 2>/dev/null || true; wait "$GSTD_PID" 2>/dev/null || true' EXIT
        
        if [[ -f "example.ts" ]]; then
            log "Running TypeScript example..."
            bun run example.ts &
            readonly CLIENT_PID=$!
            trap 'kill "$GSTD_PID" "$CLIENT_PID" 2>/dev/null || true; wait "$GSTD_PID" "$CLIENT_PID" 2>/dev/null || true' EXIT
            wait "$CLIENT_PID"
        else
            wait "$GSTD_PID"
        fi
        ;;
esac 