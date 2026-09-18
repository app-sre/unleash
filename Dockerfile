FROM registry.access.redhat.com/ubi9/nodejs-24-minimal:9.8-1789649659@sha256:d0adaa87e9c71479064b9455a1bd778a26e36ccb53be9e6bc73eae98e2be3bf6 AS base
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
