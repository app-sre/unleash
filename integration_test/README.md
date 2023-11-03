# Integration Test

Based on [k6](https://k6.io/). Testing basic unleash functionality.

## Run locally

1. make sure unleash is running locally with Docker Compose (see [README.md](../README.md))
2. create a new API token at http://localhost:4242/admin/api
3. update `CLIENT_ACCESS_TOKEN` in both `.env` files (at root and current dir) with the new token
4. restart unleash locally
5. run `docker-compose run --build test`
