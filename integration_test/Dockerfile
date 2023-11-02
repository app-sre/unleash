ARG REPO_PATH=grafana

FROM ${REPO_PATH}/k6:0.47.0

COPY test.js test.js

CMD ["run", "test.js"]
