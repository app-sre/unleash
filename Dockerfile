FROM        quay.io/app-sre/centos:7

# Set PATH, because "scl enable" does not have any effects to "docker build"
ENV         PATH /opt/rh/rh-nodejs12/root/usr/bin:$PATH

# enable scl with nodejs12
RUN         yum install centos-release-scl-rh -y && \
            yum install rh-nodejs12 rh-nodejs12-npm -y && \
            yum clean all && \
            npm install -g yarn

COPY        . .

RUN         yarn install --production

EXPOSE      4242

ENTRYPOINT  ["node"]
CMD         ["index.js"]
