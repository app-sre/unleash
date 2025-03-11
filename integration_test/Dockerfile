ARG K6_IMAGE=grafana/k6

FROM ${K6_IMAGE}:0.57.0@sha256:70af91f86cd8e142e0544a4edaf79835a80033f71974b92edd5ac36fd4442a7b

COPY test.js test.js

CMD ["run", "test.js"]
