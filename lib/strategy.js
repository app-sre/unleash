/*
Module copied from https://github.com/exlinc/keycloak-passport/blob/master/index.js

Changes:
- inspect accessTokens instead of UserInfo
- add roles to profile

*/
const util = require('util')
const OAuth2Strategy = require('passport-oauth2')
const jwt = require('jsonwebtoken')

function Strategy (options, verify) {
  [
    'host',
    'realm',
    'clientID',
    'clientSecret',
    'callbackURL',
    'authorizationURL',
    'tokenURL',
    'userInfoURL'
  ].forEach((k) => {
    if (!options[k]) {
      throw new Error(`${k} is required`)
    }
  })

  this.options = options
  this._base = Object.getPrototypeOf(Strategy.prototype)
  this._base.constructor.call(this, this.options, verify)
  this.name = 'Keycloak'
}

util.inherits(Strategy, OAuth2Strategy)

Strategy.prototype.userProfile = function (accessToken, done) {
  try {
    const json = jwt.decode(accessToken)
    const userInfo = {
      keycloakId: json.sub,
      fullName: json.name,
      firstName: json.given_name,
      lastName: json.family_name,
      username: json.preferred_username,
      email: json.email,
      avatar: json.avatar,
      realm: this.options.realm,
      roles: json.realm_access.roles
    }
    done(null, userInfo)
  } catch (e) {
    done(e)
  }
}

module.exports = Strategy
