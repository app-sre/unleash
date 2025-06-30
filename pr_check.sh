#!/bin/bash

set -euo pipefail

IMAGE_TEST=unleash-test
IMAGE_INTEGRATION_TEST=unleash-integration-test
PKO_BUILD_TEST=pko-build-test

DOCKER_CONF="${PWD}/.docker"
mkdir -p "${DOCKER_CONF}"
docker --config="${DOCKER_CONF}" login -u="${QUAY_USER}" -p="${QUAY_TOKEN}" quay.io

docker --config="${DOCKER_CONF}" build --target test -t ${IMAGE_TEST} -f Dockerfile .

# Validate pko package
docker --config="${DOCKER_CONF}" build --target test -t ${PKO_BUILD_TEST} -f pko/Dockerfile ./pko

# Test build final images
docker --config="${DOCKER_CONF}" build -t ${IMAGE_TEST} -f Dockerfile .
docker --config="${DOCKER_CONF}" build -t ${IMAGE_INTEGRATION_TEST} \
                                       -f Dockerfile.integration .

docker --config="${DOCKER_CONF}" build -t ${PKO_BUILD_TEST} -f pko/Dockerfile ./pko
