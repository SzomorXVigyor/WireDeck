FROM alpine:latest

# Install dependencies
RUN apk add --no-cache \
    gcc \
    libc-dev \
    make \
    pcre-dev \
    zlib-dev \
    openssl-dev \
    curl \
    gd-dev \
    libxslt-dev \
    geoip-dev \
    perl-dev \
    linux-headers \
    bash \
    tar

# Download and compile NGINX
ENV NGINX_VERSION=1.25.2
WORKDIR /usr/src
RUN curl -L http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz | tar xz \
    && cd nginx-${NGINX_VERSION} \
    && ./configure --prefix=/usr/share/nginx \
                   --sbin-path=/usr/sbin/nginx \
                   --conf-path=/etc/nginx/nginx.conf \
                   --pid-path=/var/run/nginx.pid \
                   --lock-path=/var/run/nginx.lock \
                   --http-log-path=/var/log/nginx/access.log \
                   --error-log-path=/var/log/nginx/error.log \
                   --with-http_ssl_module \
                   --with-http_substitutions_filter_module \
                   --with-http_gzip_static_module \
                   --with-http_stub_status_module \
                   --with-http_realip_module \
                   --with-http_v2_module \
                   --with-threads \
                   --with-stream \
    && make && make install \
    && cd .. && rm -rf nginx-${NGINX_VERSION}

# Create required directories
RUN mkdir -p /var/www/certbot /etc/letsencrypt

# Expose ports and entrypoint
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]