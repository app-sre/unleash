FROM        registry.access.redhat.com/ubi8/nodejs-12

RUN         npm install -g yarn

COPY        . .

RUN         yarn install --production

EXPOSE      4242

ENTRYPOINT  ["node"]
CMD         ["index.js"]
