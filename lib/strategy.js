/*
Module copied from https://github.com/exlinc/keycloak-passport/blob/master/index.js

Changes:
- inspect accessTokens instead of UserInfo
- add roles to profile
- verify JWT signature via Keycloak JWKS (fixes CWE-347/CWE-287)

*/
const util = require('util')
const OAuth2Strategy = require('passport-oauth2')
const jwt = require('jsonwebtoken')
const jwksRsa = require('jwks-rsa')

function Strategy (options, verify) {
  [
    'issuer',
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
  this._jwksClient = jwksRsa({
    jwksUri: `${options.issuer}/protocol/openid-connect/certs`,
    cache: true,
    rateLimit: true
  })
  this._base = Object.getPrototypeOf(Strategy.prototype)
  this._base.constructor.call(this, this.options, verify)
  this.name = 'Keycloak'
}

util.inherits(Strategy, OAuth2Strategy)

Strategy.prototype.userProfile = function (accessToken, done) {
  const getKey = (header, callback) => {
    this._jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err)
      callback(null, key.getPublicKey())
    })
  }

  jwt.verify(
    accessToken,
    getKey,
    { issuer: this.options.issuer },
    (err, json) => {
      if (err) return done(err)
      try {
        const userInfo = {
          keycloakId: json.sub,
          fullName: json.name,
          firstName: json.given_name,
          lastName: json.family_name,
          username: json.preferred_username,
          email: json.email,
          avatar: json.avatar,
          roles: json.realm_access.roles
        }
        done(null, userInfo)
      } catch (e) {
        done(e)
      }
    }
  )
}

module.exports = Strategy
