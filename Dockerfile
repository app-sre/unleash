FROM registry.access.redhat.com/ubi9/nodejs-20-minimal:9.7-1778604817@sha256:87f2eb0ce06e922a7629fa94fad62ed4e6be05931852b779269e0692282a099e AS base
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
