'use strict'

const unleash = require('unleash-server')
const { enableKeycloakOauth } = require('./app')

const options = {
  authentication: {
    type: 'custom',
    customAuthHandler: enableKeycloakOauth
  },
  enableRequestLogger: true,
  logLevel: 'info'
}

unleash.start(options).then((instance) => {
  console.log(
    `Unleash started on http://localhost:${instance.app.get('port')}`
  )
})
