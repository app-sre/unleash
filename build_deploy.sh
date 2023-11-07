#!/bin/bash

set -euo pipefail

IMAGE_NAME="quay.io/app-sre/unleash"
PKO_IMAGE_NAME="quay.io/app-sre/unleash-pko"
INTEGRATION_TEST_IMAGE_TAG_PREFIX="integration-test-"
K6_IMAGE="quay.io/app-sre/k6"
IMAGE_TAG=$(git rev-parse --short=7 HEAD)

# build and push unleash image
docker build -t "${IMAGE_NAME}:latest" .
docker tag "${IMAGE_NAME}:latest" "${IMAGE_NAME}:${IMAGE_TAG}"

docker build -t "${IMAGE_NAME}:${INTEGRATION_TEST_IMAGE_TAG_PREFIX}${IMAGE_TAG}" -f integration_test/Dockerfile --build-arg="K6_IMAGE=$K6_IMAGE" ./integration_test

DOCKER_CONF="${PWD}/.docker"
mkdir -p "${DOCKER_CONF}"
docker --config="${DOCKER_CONF}" login -u="${QUAY_USER}" -p="${QUAY_TOKEN}" quay.io

docker --config="${DOCKER_CONF}" push "${IMAGE_NAME}:latest"
docker --config="${DOCKER_CONF}" push "${IMAGE_NAME}:${IMAGE_TAG}"

docker --config="${DOCKER_CONF}" push "${IMAGE_NAME}:${INTEGRATION_TEST_IMAGE_TAG_PREFIX}${IMAGE_TAG}"

# build and push PKO image
PKO_BUILD_IMAGE="pko-build:${IMAGE_TAG}"
PKO_BUILD_CONTAINER="pko-build-${IMAGE_TAG}"
docker build -t "$PKO_BUILD_IMAGE" -f pko/Dockerfile --build-arg="PKO_IMAGE_NAME=$PKO_IMAGE_NAME" --build-arg="IMAGE_TAG=$IMAGE_TAG" ./pko
docker create --name "$PKO_BUILD_CONTAINER" "$PKO_BUILD_IMAGE"
docker cp "$PKO_BUILD_CONTAINER":/tmp/image.tgz pko/image.tgz
docker rm "$PKO_BUILD_CONTAINER"
docker load < pko/image.tgz
docker --config="${DOCKER_CONF}" push "${PKO_IMAGE_NAME}:latest"
docker --config="${DOCKER_CONF}" push "${PKO_IMAGE_NAME}:${IMAGE_TAG}"
