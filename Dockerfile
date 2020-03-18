FROM        node:10-alpine

COPY        unleash ./

WORKDIR     unleash/

RUN         npm install unleash-server -g

EXPOSE      4242

ENTRYPOINT  ["unleash"]
