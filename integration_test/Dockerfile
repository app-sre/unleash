ARG K6_IMAGE=grafana/k6

FROM ${K6_IMAGE}:0.58.0@sha256:6a4eabc37ea8274aff48804ff1add146b4eda476fdf50ea6e9cdf083a3967616

COPY test.js test.js

CMD ["run", "test.js"]
