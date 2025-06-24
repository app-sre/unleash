
ARG K6_VERSION=0.47.0
FROM registry.access.redhat.com/ubi9/ubi:9.6-1749542372
RUN curl -sfL https://github.com/grafana/k6/releases/download/v${K6_VERSION}/k6-v${K6_VERSION}-linux-amd64.tar.gz \
    | tar -zxf - -C /usr/local/bin --strip-components=1 && \
    rm -rf k6-v${K6_VERSION}-linux-amd64

COPY test.js test.js

CMD ["run", "test.js"]
