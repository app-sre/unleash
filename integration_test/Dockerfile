FROM registry.access.redhat.com/ubi9/ubi:9.6-1749542372@sha256:861e833044a903f689ecfa404424494a7e387ab39cf7949c54843285d13a9774 as downloader

ENV K6_VERSION=0.47.0

RUN mkdir -p /tmp/k6 && \
    curl -sfL https://github.com/grafana/k6/releases/download/v${K6_VERSION}/k6-v${K6_VERSION}-linux-amd64.tar.gz \
    | tar -zxf - -C /tmp/k6 --strip-components=1 && \
    chmod +x /tmp/k6/k6 


FROM registry.access.redhat.com/ubi9/ubi-minimal:9.6-1749489516@sha256:f172b3082a3d1bbe789a1057f03883c1113243564f01cd3020e27548b911d3f8
COPY --from=downloader /tmp/k6/k6 /usr/local/bin/k6
COPY test.js /test.js
CMD ["k6","run", "/test.js"]
