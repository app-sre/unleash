# App SRE Unleash

<!-- CI test change - safe to remove -->

Feature toggle as a service - Powered by [Unleash](https://github.com/Unleash/unleash)

## Server

The Unleash Feature Toggle Service gets all its configurations from
environment variables. Here's the description of the variables that have
to be provided:

Database:

- `DATABASE_NAME`: The database to use backing this instance.
- `DATABASE_HOST`: The database hostname or ip address.
- `DATABASE_USERNAME`: The database username.
- `DATABASE_PASSWORD`: The database password.

Keycloak:

- `KC_HOST`: The Keycloak url.
- `KC_REALM`: The Keycloak realm.
- `KC_CLIENT_ID`: The Keycloak client id.
- `KC_CLIENT_SECRET`: The Keycloak client secret.
- `KC_ADMIN_ROLES`: The Keycloak admin roles, separated by comma.
- `KC_EDITOR_ROLES`: The Keycloak editor roles, separated by comma.
- `KC_VIEWER_ROLES`: The Keycloak viewer roles, separated by comma.

[API Access](https://docs.getunleash.io/using-unleash/deploy/configuring-unleash#further-customization):

- `INIT_ADMIN_API_TOKENS`: The Admin API token that admins have to
  authenticate with. This is a comma separated list of tokens, [format](https://docs.getunleash.io/reference/api-tokens-and-client-keys#format).
- `INIT_CLIENT_API_TOKENS`: The Client API token that clients have to
  authenticate with. This is a comma separated list of tokens, [format](https://docs.getunleash.io/reference/api-tokens-and-client-keys#format).
  Should include tokens for 3 environments (`default`, `develement`, `production`).

### Running Locally

#### Install

```
$ npm install --production
```

#### Run

```
$ node index.js
```

### Running with Docker

#### Build

```
$ docker build -t unleash .
```

#### Run

```
$ docker run --rm -d -p 4242:4242 unleash
```

### Running with Docker Compose

#### Run

Copy [.env.example](./.env.example) to `.env`.

```
$ docker-compose up --build
```

Default users can be found in [unleash-users-0.json](./keycloak_data/unleash-users-0.json), password is `unleash`.

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


headers = {'Authorization': CLIENT_ACCESS_TOKEN}

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

headers = {'Authorization': ADMIN_ACCESS_TOKEN}

data = {"enabled": False,
        "strategies": [{"name": "default"}]}

res = requests.put('http://localhost:4242/api/admin/features/quay-mirror',
                   headers=headers, json=data)

res.raise_for_status()
```
