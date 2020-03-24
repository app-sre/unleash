# App SRE Unleash

Feature toggle as a service - Powered by [Unleash](https://github.com/Unleash/unleash)

# Use

## Manually

### Install

```
$ yarn install --production
```

### Configure

Set the following environment variables:

- `DATABASE_URL`: The full PostgreSQL URL.
- `GH_CLIENT_ID`: The Github OAuth App Client ID.
- `GH_CLIENT_SECRET`: The Github OAuth App Client Secret.
- `GH_CALLBACK_URL`: The OAuth callback URL.
- `CLIENT_ACCESS_TOKEN`: The Client API Bearer Token that users have to
  authenticate with.
- `ORGS`: The comma-separated list of Github authorized organizations.

### Run

```
$ node index.js
```

## Docker

### Build
```
$ docker built -t unleash .
```

### Run
```
$ docker run --rm -d -p 4242:4242 \
    -e GH_CLIENT_ID=<GH_CLIENT_ID> \
    -e GH_CLIENT_SECRET=<GH_CLIENT_SECRET> \
    -e GH_CALLBACK_URL=<GH_CALLBACK_URL> \
    -e CLIENT_ACCESS_TOKEN=<CLIENT_ACCESS_TOKEN> \
    -e DATABASE_URL=<DATABASE_URL> \
    -e ORGS=<ORGS> \
    unleash
```
