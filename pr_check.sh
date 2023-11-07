#!/bin/bash

IMAGE_TEST=unleash-test
IMAGE_INTEGRATION_TEST=unleash-integration-test
K6_IMAGE="quay.io/app-sre/k6"
PKO_BUILD_TEST=pko-build-test

# Let's just build the image. That's enough test for now.
docker build -t ${IMAGE_TEST} -f Dockerfile .
docker build -t ${IMAGE_INTEGRATION_TEST} -f integration_test/Dockerfile --build-arg="K6_IMAGE=$K6_IMAGE" ./integration_test

# Validate package
docker build --target test -t ${PKO_BUILD_TEST} -f pko/Dockerfile ./pko
# todo - use test feature
