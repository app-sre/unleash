'use strict'

const unleash = require('unleash-server')
const { enableKeycloakOauth } = require('./app')
const { SESSION_SECRET } = require('./env')

const options = {
  enableLegacyRoutes: false,
  secret: SESSION_SECRET,
  authentication: {
    type: 'custom',
    customAuthHandler: enableKeycloakOauth
  },
  server: {
    enableRequestLogger: true,
    baseUriPath: ''
  },
  logLevel: 'info'
}

unleash.start(options).then((instance) => {
  console.log(
    `Unleash started on http://localhost:${instance.app.get('port')}`
  )
})
