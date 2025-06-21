# Multi-stage build for optimized GStreamer Daemon with TypeScript client
FROM alpine:3.19 AS builder

RUN apk add --no-cache \
    build-base \
    git \
    autoconf \
    automake \
    libtool \
    pkgconfig \
    gstreamer-dev \
    gst-plugins-base-dev \
    glib-dev \
    json-glib-dev \
    gtk-doc \
    ncurses-dev \
    libdaemon-dev \
    jansson-dev \
    libsoup-dev \
    python3 \
    libedit-dev \
    meson \
    ninja \
    curl

WORKDIR /tmp

RUN git clone --depth 1 --branch master https://github.com/RidgeRun/gstd-1.x.git gstd

WORKDIR /tmp/gstd

RUN ./autogen.sh && \
    ./configure --prefix=/usr/local --enable-shared=no --enable-static=yes && \
    make -j$(nproc) && \
    make install-strip

FROM node:21-alpine AS bun-installer

RUN npm install -g bun

FROM alpine:3.19 AS runtime

RUN apk add --no-cache \
    gstreamer \
    gst-plugins-base \
    gst-plugins-good \
    gst-plugins-bad \
    gst-plugins-ugly \
    gst-libav \
    glib \
    json-glib \
    ncurses-libs \
    libdaemon \
    jansson \
    libsoup \
    libedit \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

COPY --from=bun-installer /usr/local/bin/bun /usr/local/bin/
COPY --from=bun-installer /usr/local/bin/bunx /usr/local/bin/

COPY --from=builder /usr/local/bin/gstd /usr/local/bin/
COPY --from=builder /usr/local/bin/gst-client /usr/local/bin/

RUN addgroup -g 1001 -S gstd && \
    adduser -S -D -H -u 1001 -s /sbin/nologin -G gstd gstd

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile && \
    rm -rf ~/.bun/install/cache

COPY --chown=gstd:gstd . .

RUN bun run generate && \
    chmod +x entrypoint.sh

USER gstd

EXPOSE 8080

ENV GST_DEBUG=1
ENV GSTD_HTTP_PORT=8080
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${GSTD_HTTP_PORT}/pipelines || exit 1

ENTRYPOINT ["./entrypoint.sh"]