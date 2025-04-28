FROM registry.access.redhat.com/ubi8/nodejs-18-minimal@sha256:ae01b012412f008385642d059d95ec7659f59ae297252173b711e64206cfa9c0 as base
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
