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
  const params = {
    headers: {
      Authorization: CLIENT_ACCESS_TOKEN
    }
  }

  const res = http.get(API_CLIENT_FEATURES_URL, params)

  check(res, {
    'apiClientFeatures response code was 200': (res) => res.status === 200
  })
}
