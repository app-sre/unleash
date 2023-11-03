#!/bin/bash

IMAGE_TEST=unleash-test
IMAGE_INTEGRATION_TEST=unleash-integration-test
K6_IMAGE="quay.io/app-sre/k6"

# Let's just build the image. That's enough test for now.
docker build -t ${IMAGE_TEST} -f Dockerfile .
docker build -t ${IMAGE_INTEGRATION_TEST} -f integration_test/Dockerfile --build-arg="K6_IMAGE=$K6_IMAGE" ./integration_test

# Validate package
docker run -v .:/unleash:z quay.io/app-sre/package-operator-cli:92430cd validate /unleash/pko/package
docker run -v .:/unleash:z quay.io/app-sre/package-operator-cli:92430cd tree /unleash/pko/package --config-path /unleash/pko/validation_config.yaml
# todo - use test feature
