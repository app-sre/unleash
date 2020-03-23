FROM        node:10-alpine

COPY        . .

RUN         yarn install --production

EXPOSE      4242

ENTRYPOINT  ["node"]
CMD         ["index.js"]
