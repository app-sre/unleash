FROM registry.access.redhat.com/ubi8/nodejs-16

USER 0

RUN set -eux && \
  npm set progress=false && \
  npm set update-notifier=false && \
  npm set audit=false && \
  npm install -g yarn && \
  npm cache clean --force

USER 1001

COPY --chown=1001:root package.json yarn.lock ./

RUN set -eux && \
  yarn install --frozen-lockfile --ignore-scripts --production && \
  yarn cache clean

COPY --chown=1001:root . ./

ENV NODE_ENV production

EXPOSE 4242

ENTRYPOINT ["node"]

CMD ["index.js"]
