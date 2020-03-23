#!/bin/bash

IMAGE_TEST=unleash-test

# Let's just build the image. That's enough test for now.
docker build -t ${IMAGE_TEST} -f Dockerfile .
