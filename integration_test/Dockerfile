ARG K6_IMAGE=grafana/k6

FROM ${K6_IMAGE}:0.47.0

COPY test.js test.js

CMD ["run", "test.js"]
