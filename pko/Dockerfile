ARG PKO_IMAGE_NAME=quay.io/app-sre/unleash-pko
ARG IMAGE_TAG=latest

FROM quay.io/app-sre/package-operator-cli:92430cd@sha256:9e1eb7d2ea77ec96920a065970c5c228c41b01b6b3df0af8ff01010d1d69dc66 as base
WORKDIR /tmp
COPY . .

FROM base as test
RUN /kubectl-package validate ./package
RUN /kubectl-package tree ./package --config-path ./validation_config.yaml

FROM base
ARG PKO_IMAGE_NAME
ARG IMAGE_TAG
USER 0
RUN sed -i "s/UNLEASH_IMAGE_TAG/$IMAGE_TAG/g" ./package/manifest.yaml
RUN /kubectl-package build -t "${PKO_IMAGE_NAME}:${IMAGE_TAG}" -t "${PKO_IMAGE_NAME}:latest" ./package -o image.tgz
