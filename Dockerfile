FROM registry.access.redhat.com/ubi8/nodejs-18-minimal:1-145@sha256:47c5528b5e0d533fd723749e853ceb5464a1b444286d5efc3bacbb4326112562 AS base
COPY LICENSE /licenses/LICENSE
USER 1001

FROM base AS builder
ENV NODE_ENV production
COPY --chown=1001:0 package*.json .npmrc ./
RUN npm ci

FROM builder AS test
ENV NODE_ENV dev
RUN npm ci
COPY --chown=1001:0 . .
RUN npm run lint
RUN npm test

FROM base AS prod
ENV NODE_ENV production
COPY --from=builder --chown=1001:0 /opt/app-root/src/node_modules ./node_modules
COPY --chown=1001:0 . .
EXPOSE 4242
ENTRYPOINT ["node"]
CMD ["index.js"]
