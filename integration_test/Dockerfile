ARG K6_IMAGE=grafana/k6

FROM ${K6_IMAGE}:1.0.0@sha256:f21270290d702cbf0a7d6ba5d7ed100b63bcb233b558b885ed787547b3488279

COPY test.js test.js

CMD ["run", "test.js"]
