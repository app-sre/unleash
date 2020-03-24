# App SRE Unleash

Feature toggle as a service - Powered by [Unleash](https://github.com/Unleash/unleash)

## Server

The Unleash Feature Toggle Service gets all its configurations from
environment variables. Here's the description of the variables that have
to be provided:

- `DATABASE_URL`: The full PostgreSQL URL.
- `GH_CLIENT_ID`: The Github OAuth App Client ID.
- `GH_CLIENT_SECRET`: The Github OAuth App Client Secret.
- `GH_CALLBACK_URL`: The OAuth callback URL.
- `ADMIN_ACCESS_TOKEN`: The Admin API Bearer token that admins have to
  authenticate with.
- `CLIENT_ACCESS_TOKEN`: The Client API Bearer token that clients have to
  authenticate with.
- `TOKEN_SECRET`: Token used to encrypt the user session cookie.
- `ORGS`: The comma-separated list of Github authorized organizations.

### Running Locally

#### Install

```
$ yarn install --production
```

#### Run

```
$ node index.js
```

### Running with Docker

#### Build

```
$ docker built -t unleash .
```

#### Run

```
$ docker run --rm -d -p 4242:4242 unleash
```

## API

### Client

Unleash provides an [API client](https://github.com/Unleash/unleash-client-python).

Install:

```
$ pip install UnleashClient
```

Example:
```
from UnleashClient import UnleashClient


headers = {'Authorization': f'Bearer {CLIENT_ACCESS_TOKEN}'}

client = UnleashClient(url="http://localhost:4242/api",
                       app_name="My App",
                       custom_headers=headers)

client.initialize_client()

if client.is_enabled("quay-mirror"):
    print('quay-mirror toogle is enabled!')

client.destroy()
```

### Admin

There's no client for the Admin API. Let's use `requests` then.

Install:

```
$ pip install requests
```

Example:
```
import requests

headers = {'Authorization': f'Bearer {ADMIN_ACCESS_TOKEN}'}

data = {"enabled": False,
        "strategies": [{"name": "default"}]}

res = requests.put('http://localhost:4242/api/admin/features/quay-mirror',
                   headers=headers, json=data)

res.raise_for_status()
```
