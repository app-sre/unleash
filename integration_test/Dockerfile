FROM registry.access.redhat.com/ubi9/ubi:9.6-1749542372 as downloader
ENV K6_VERSION=0.47.0
RUN mkdir -p /tmp/k6 && \
    curl -sfL https://github.com/grafana/k6/releases/download/v${K6_VERSION}/k6-v${K6_VERSION}-linux-amd64.tar.gz \
    | tar -zxf - -C /tmp/k6 --strip-components=1 && \
    chmod +x /tmp/k6/k6 && \
    rm -rf k6-v${K6_VERSION}-linux-amd64


FROM registry.access.redhat.com/ubi9/ubi-minimal:9.6-1749489516
COPY --chown=0:0 --from=downloader \
     /tmp/k6 /usr/local/bin
COPY test.js test.js

CMD ["run", "test.js"]
