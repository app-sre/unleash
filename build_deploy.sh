#!/bin/bash

IMAGE_NAME="quay.io/app-sre/unleash"
PKO_IMAGE_NAME="quay.io/app-sre/unleash-pko"
IMAGE_TAG=$(git rev-parse --short=7 HEAD)

# build and push unleash image
docker build -t "${IMAGE_NAME}:latest" .
docker tag "${IMAGE_NAME}:latest" "${IMAGE_NAME}:${IMAGE_TAG}"

DOCKER_CONF="${PWD}/.docker"
mkdir -p "${DOCKER_CONF}"
docker --config="${DOCKER_CONF}" login -u="${QUAY_USER}" -p="${QUAY_TOKEN}" quay.io

docker --config="${DOCKER_CONF}" push "${IMAGE_NAME}:latest"
docker --config="${DOCKER_CONF}" push "${IMAGE_NAME}:${IMAGE_TAG}"

# build and push PKO image
docker run -v .:/unleash:z quay.io/app-sre/package-operator-cli:a03f0f0 build -t "${PKO_IMAGE_NAME}:${IMAGE_TAG}" -t "${PKO_IMAGE_NAME}:latest" /unleash/pko/package -o /unleash/pko/image.tgz
docker load < pko/image.tgz
docker --config="${DOCKER_CONF}" push "${PKO_IMAGE_NAME}:latest"
docker --config="${DOCKER_CONF}" push "${PKO_IMAGE_NAME}:${IMAGE_TAG}"
