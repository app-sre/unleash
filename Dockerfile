FROM registry.access.redhat.com/ubi8/nodejs-16

USER 0

RUN set -eux && \
  npm set progress=false && \
  npm set update-notifier=false && \
  npm set audit=false && \
  npm set fund=false

USER 1001

COPY --chown=1001:root package.json package-lock.json ./

ENV NODE_ENV production

RUN set -eux && \
  npm install-clean && \
  npm cache clean --force

COPY --chown=1001:root . ./

EXPOSE 4242

ENTRYPOINT ["node"]

CMD ["index.js"]
