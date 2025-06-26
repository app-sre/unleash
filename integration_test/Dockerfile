FROM registry.access.redhat.com/ubi9/ubi:9.6-1750786174@sha256:7a4818cdb8e0461d75d4bdfa42a355d3725bcc8cc0cc5d467021119d5962ce6b as downloader

ENV K6_VERSION=0.47.0

RUN mkdir -p /tmp/k6 && \
    curl -sfL https://github.com/grafana/k6/releases/download/v${K6_VERSION}/k6-v${K6_VERSION}-linux-amd64.tar.gz \
    | tar -zxf - -C /tmp/k6 --strip-components=1 && \
    chmod +x /tmp/k6/k6 


FROM registry.access.redhat.com/ubi9/ubi-minimal:9.6-1750782676@sha256:e12131db2e2b6572613589a94b7f615d4ac89d94f859dad05908aeb478fb090f
COPY --from=downloader /tmp/k6/k6 /usr/local/bin/k6
COPY test.js /test.js
CMD ["k6","run", "/test.js"]
