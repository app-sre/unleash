#!/bin/bash

set -euo pipefail

IMAGE_TEST=unleash-test
IMAGE_INTEGRATION_TEST=unleash-integration-test
K6_IMAGE="quay.io/app-sre/k6"
PKO_BUILD_TEST=pko-build-test

docker build --target dev -t ${IMAGE_TEST} -f Dockerfile .
docker run --rm ${IMAGE_TEST} npm run lint
docker run --rm ${IMAGE_TEST} npm run test

# Validate pko package
docker build --target test -t ${PKO_BUILD_TEST} -f pko/Dockerfile ./pko

# Test build final images
docker build -t ${IMAGE_TEST} -f Dockerfile .
docker build -t ${IMAGE_INTEGRATION_TEST} -f integration_test/Dockerfile --build-arg="K6_IMAGE=$K6_IMAGE" ./integration_test
docker build -t ${PKO_BUILD_TEST} -f pko/Dockerfile ./pko
