FROM registry.access.redhat.com/ubi8/nodejs-18

USER 1001

RUN set -eux && \
  npm set progress=false && \
  npm set update-notifier=false && \
  npm set audit=false && \
  npm set fund=false

COPY --chown=1001:root package.json package-lock.json ./

ENV NODE_ENV production

RUN set -eux && \
  npm ci && \
  npm cache clean --force

COPY --chown=1001:root . ./

EXPOSE 4242

ENTRYPOINT ["node"]

CMD ["index.js"]
