#!/bin/bash

set -euo pipefail

teardown() {
  rm -rfv "$DOCKER_CONFIG"
}

IMAGE_NAME="quay.io/app-sre/unleash"
PKO_IMAGE_NAME="quay.io/app-sre/unleash-pko"
K6_IMAGE="quay.io/app-sre/k6"
IMAGE_TAG=$(git rev-parse --short=7 HEAD)
INTEGRATION_TEST_IMAGE_TAG="integration-test-${IMAGE_TAG}"
DOCKER_CONFIG=$(mktemp -d -p "$HOME" "build-deploy-XXXXXXXX")
export DOCKER_CONFIG
trap teardown EXIT

docker login -u="$QUAY_USER" --password-stdin quay.io <<< "$QUAY_TOKEN"

# build and push unleash image
docker build -t "${IMAGE_NAME}:latest" -t "${IMAGE_NAME}:${IMAGE_TAG}" .
docker build -t "${IMAGE_NAME}:${INTEGRATION_TEST_IMAGE_TAG}" \
                                       -f integration_test/Dockerfile \
                                       --build-arg="K6_IMAGE=$K6_IMAGE" \
                                       ./integration_test

for tag in latest "$IMAGE_TAG" "$INTEGRATION_TEST_IMAGE_TAG"; do
    docker push "${IMAGE_NAME}:${tag}"
done

# build and push PKO image
PKO_BUILD_IMAGE="pko-build:${IMAGE_TAG}"
PKO_BUILD_CONTAINER="pko-build-${IMAGE_TAG}"
docker build -t "$PKO_BUILD_IMAGE" \
  -f pko/Dockerfile \
  --build-arg="PKO_IMAGE_NAME=$PKO_IMAGE_NAME" \
  --build-arg="IMAGE_TAG=$IMAGE_TAG" \
  ./pko

docker create --name "$PKO_BUILD_CONTAINER" "$PKO_BUILD_IMAGE"
docker cp "$PKO_BUILD_CONTAINER":/tmp/image.tgz pko/image.tgz
docker rm "$PKO_BUILD_CONTAINER"
docker load < pko/image.tgz

docker push "${PKO_IMAGE_NAME}:latest"
docker push "${PKO_IMAGE_NAME}:${IMAGE_TAG}"
