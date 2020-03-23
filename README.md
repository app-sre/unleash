# [WIP] Unleash

**Under development / not production ready**

Feature toggle as a service - Powered by Unleash

# Install

```
$ yarn install --production
```

# Run

Set the following environment variables:

- DATABASE_URL: The full PostgreSQL URL.
- GH_CLIENT_ID: The Github OAuth App Client ID.
- GH_CLIENT_SECRET: The Github OAuth App Client Secret.
- GH_CALLBACK_URL: The OAuth callback URL.
- CLIENT_ACCESS_TOKEN: The Client API Bearer Token that users have to
  authenticate with.

Execute:

```
$ node index.js
```
