FROM        registry.access.redhat.com/ubi8/nodejs-16

RUN         npm install -g yarn

COPY        package.json yarn.lock ./

RUN         yarn install --frozen-lockfile --production

COPY        . ./

EXPOSE      4242

ENTRYPOINT  ["node"]
CMD         ["index.js"]
