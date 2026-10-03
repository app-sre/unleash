FROM registry.access.redhat.com/ubi9/nodejs-24-minimal:9.8-1790838157@sha256:d61174601fc7035a21a43b74e3af25cfe97f1c37de21ea11badee2de6ffeb926 AS base
COPY LICENSE /licenses/LICENSE
USER 1001

FROM base AS builder
ENV NODE_ENV=production
COPY --chown=1001:0 package*.json .npmrc ./
RUN npm ci

FROM builder AS test
ENV NODE_ENV=dev
RUN npm ci
COPY --chown=1001:0 . .
RUN npm run lint
RUN npm test

FROM base AS prod
ENV NODE_ENV=production
COPY --from=builder --chown=1001:0 /opt/app-root/src/node_modules ./node_modules
COPY --chown=1001:0 . .
EXPOSE 4242
ENTRYPOINT ["node"]
CMD ["index.js"]
