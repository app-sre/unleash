ARG K6_IMAGE=grafana/k6

FROM ${K6_IMAGE}:0.59.0@sha256:654b5a04672361b7f5ed76359c985e0b2a1e28e0ca15495466ad4c732006e1f3

COPY test.js test.js

CMD ["run", "test.js"]
