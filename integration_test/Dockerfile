ARG K6_IMAGE=grafana/k6

FROM ${K6_IMAGE}:0.47.0@sha256:f7650fff23d183b96a51be366aaadd90a29548585a24407f4ec9712cbd66ec73

COPY test.js test.js

CMD ["run", "test.js"]
