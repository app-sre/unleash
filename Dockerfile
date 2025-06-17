FROM registry.access.redhat.com/ubi8/nodejs-18-minimal@sha256:4fbc186feabefd318385b3fd89e6747125781174ebfdfb4197492ee819cf2b0a as base
USER 1001
COPY --chown=1001:0 package*.json .npmrc ./

FROM base as dev
RUN npm ci
COPY --chown=1001:0 . .

FROM base as prod
ENV NODE_ENV production
RUN npm ci

FROM base
ENV NODE_ENV production
COPY --from=prod --chown=1001:0 /opt/app-root/src/node_modules ./node_modules
COPY --chown=1001:0 . .
EXPOSE 4242
ENTRYPOINT ["node"]
CMD ["index.js"]
