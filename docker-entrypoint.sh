#!/bin/bash

set -euo pipefail

readonly GST_DEBUG=${GST_DEBUG:-1}
readonly GSTD_HTTP_PORT=${GSTD_HTTP_PORT:-8080}
readonly GSTD_UNIX_SOCKET=${GSTD_UNIX_SOCKET:-""}
readonly GSTD_ENABLE_HTTP=${GSTD_ENABLE_HTTP:-true}
readonly GSTD_ENABLE_UNIX=${GSTD_ENABLE_UNIX:-false}
readonly GSTD_EXTRA_FLAGS=${GSTD_EXTRA_FLAGS:-""}

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >&2
}

build_gstd_args() {
    local args=()
    
    args+=("-e")
    
    if [[ "$GSTD_ENABLE_HTTP" == "true" ]]; then
        args+=("--enable-http-protocol --http-address=0.0.0.0 --http-port=$GSTD_HTTP_PORT")
        log "HTTP interface enabled on port $GSTD_HTTP_PORT"
    fi
    
    if [[ "$GSTD_ENABLE_UNIX" == "true" && -n "$GSTD_UNIX_SOCKET" ]]; then
        args+=("--enable-unix-protocol --unix-socket=$GSTD_UNIX_SOCKET")
        log "Unix socket interface enabled at $GSTD_UNIX_SOCKET"
    fi
    
    if [[ -n "$GSTD_EXTRA_FLAGS" ]]; then
        read -ra extra_flags <<< "$GSTD_EXTRA_FLAGS"
        args+=("${extra_flags[@]}")
        log "Extra flags added: $GSTD_EXTRA_FLAGS"
    fi
    
    echo "${args[@]}"
}

main() {
    log "Starting GStreamer Daemon"
    log "GST_DEBUG level: $GST_DEBUG"
    log "HTTP enabled: $GSTD_ENABLE_HTTP"
    log "Unix socket enabled: $GSTD_ENABLE_UNIX"
    
    if [[ "$GSTD_ENABLE_HTTP" != "true" && "$GSTD_ENABLE_UNIX" != "true" ]]; then
        log "ERROR: At least one interface (HTTP or Unix socket) must be enabled"
        exit 1
    fi
    
    if [[ "$GSTD_ENABLE_UNIX" == "true" && -z "$GSTD_UNIX_SOCKET" ]]; then
        log "ERROR: Unix socket enabled but GSTD_UNIX_SOCKET not specified"
        exit 1
    fi
    
    local gstd_args
    gstd_args=$(build_gstd_args)
    
    log "Executing: gstd $gstd_args"
    exec gstd $gstd_args
}

main "$@" 