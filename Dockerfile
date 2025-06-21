# Multi-stage build for optimized GStreamer Daemon
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
    python3-dev \
    libedit-dev \
    meson \
    ninja \
    curl \
    flex \
    bison \
    gettext-dev \
    intltool \
    bash \
    make \
    gcc \
    g++ \
    libc-dev \ 
    ninja-build \
    sudo

WORKDIR /tmp

RUN git clone --depth 1 --branch master https://github.com/RidgeRun/gstd-1.x.git gstd

WORKDIR /tmp/gstd

RUN ./autogen.sh
RUN ./configure --disable-python --disable-gtk-doc
RUN make
RUN cd /tmp/gstd/gstd && make install
RUN cd /tmp/gstd/gst_client && make install  
RUN cd /tmp/gstd/libgstd && make install
RUN cd /tmp/gstd/libgstc/c && make install

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

COPY --from=builder /usr/local/bin/gstd /usr/local/bin/
COPY --from=builder /usr/local/bin/gst-client* /usr/local/bin/
COPY --from=builder /usr/local/lib/libgstd-1.0.so* /usr/local/lib/
COPY --from=builder /usr/local/lib/libgstc-1.0.so* /usr/local/lib/

RUN addgroup -g 1001 -S gstd && \
    adduser -S -D -H -u 1001 -s /sbin/nologin -G gstd gstd

WORKDIR /app

COPY gstd.yml ./
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

USER gstd

EXPOSE 8080

ENV GST_DEBUG=1
ENV GSTD_HTTP_PORT=8080
ENV GSTD_UNIX_SOCKET=""
ENV GSTD_ENABLE_HTTP=true
ENV GSTD_ENABLE_UNIX=false
ENV GSTD_EXTRA_FLAGS=""

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${GSTD_HTTP_PORT}/pipelines || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]