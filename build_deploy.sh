#!/bin/bash

set -euo pipefail

IMAGE_NAME="quay.io/app-sre/unleash"
PKO_IMAGE_NAME="quay.io/app-sre/unleash-pko"
INTEGRATION_TEST_IMAGE_TAG_PREFIX="integration-test-"
IMAGE_TAG=$(git rev-parse --short=7 HEAD)

DOCKER_CONF="${PWD}/.docker"
mkdir -p "${DOCKER_CONF}"
docker --config="${DOCKER_CONF}" login -u="${QUAY_USER}" -p="${QUAY_TOKEN}" quay.io

# build and push unleash image
docker --config="${DOCKER_CONF}" build -t "${IMAGE_NAME}:latest" .
docker tag "${IMAGE_NAME}:latest" "${IMAGE_NAME}:${IMAGE_TAG}"

docker --config="${DOCKER_CONF}" build -t "${IMAGE_NAME}:${INTEGRATION_TEST_IMAGE_TAG_PREFIX}${IMAGE_TAG}" \
                                       -f Dockerfile.integration .

docker --config="${DOCKER_CONF}" push "${IMAGE_NAME}:latest"
docker --config="${DOCKER_CONF}" push "${IMAGE_NAME}:${IMAGE_TAG}"

docker --config="${DOCKER_CONF}" push "${IMAGE_NAME}:${INTEGRATION_TEST_IMAGE_TAG_PREFIX}${IMAGE_TAG}"

# build and push PKO image
PKO_BUILD_IMAGE="pko-build:${IMAGE_TAG}"
PKO_BUILD_CONTAINER="pko-build-${IMAGE_TAG}"
docker --config="${DOCKER_CONF}" build -t "$PKO_BUILD_IMAGE" \
                                       -f pko/Dockerfile \
                                       --build-arg="PKO_IMAGE_NAME=$PKO_IMAGE_NAME" \
                                       --build-arg="IMAGE_TAG=$IMAGE_TAG" \
                                       ./pko
docker create --name "$PKO_BUILD_CONTAINER" "$PKO_BUILD_IMAGE"
docker cp "$PKO_BUILD_CONTAINER":/tmp/image.tgz pko/image.tgz
docker rm "$PKO_BUILD_CONTAINER"
docker load < pko/image.tgz
docker --config="${DOCKER_CONF}" push "${PKO_IMAGE_NAME}:latest"
docker --config="${DOCKER_CONF}" push "${PKO_IMAGE_NAME}:${IMAGE_TAG}"
