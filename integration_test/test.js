import { check } from 'k6'
import http from 'k6/http'

const UNLEASH_BASE_URL = __ENV.UNLEASH_BASE_URL
const API_CLIENT_FEATURES_URL = `${UNLEASH_BASE_URL}/api/client/features`
const CLIENT_ACCESS_TOKEN = __ENV.CLIENT_ACCESS_TOKEN

export const options = {
  thresholds: {
    checks: ['rate==1']
  },
  scenarios: {
    homepage: {
      exec: 'homepage',
      executor: 'per-vu-iterations',
      iterations: 1,
      vus: 1
    },
    apiClientFeatures: {
      exec: 'apiClientFeatures',
      executor: 'per-vu-iterations',
      iterations: 1,
      vus: 1
    }
  }
}

export function homepage () {
  const res = http.get(UNLEASH_BASE_URL)

  check(res, {
    'homepage response code was 200': (res) => res.status === 200
  })
}

export function apiClientFeatures () {
  const res1 = http.get(API_CLIENT_FEATURES_URL)

  check(res1, {
    'unauthenticated apiClientFeatures response code was 401': (res) => res.status === 401
  })

  const params = {
    headers: {
      Authorization: CLIENT_ACCESS_TOKEN
    }
  }

  const res2 = http.get(API_CLIENT_FEATURES_URL, params)

  check( {
    'authenticated apiClientFeatures response code was 200': (res) => res.status === 200
  })
}
