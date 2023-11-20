const { AuthenticationRequired } = require('unleash-server')
const KeycloakStrategy = require('./lib/strategy.js')
const passport = require('passport')
const {
  KC_HOST,
  KC_REALM,
  KC_CLIENT_ID,
  KC_CLIENT_SECRET,
  KC_ADMIN_ROLES,
  KC_EDITOR_ROLES,
  KC_VIEWER_ROLES
} = require('./env')

const getRole = (userRoles) => {
  if (
    userRoles.some((item1) =>
      KC_ADMIN_ROLES.some(
        (item2) => item2.toLowerCase() === item1.toLowerCase()
      )
    )
  ) {
    return 'Admin'
  }
  if (
    userRoles.some((item1) =>
      KC_EDITOR_ROLES.some(
        (item2) => item2.toLowerCase() === item1.toLowerCase()
      )
    )
  ) {
    return 'Editor'
  }
  if (
    userRoles.some((item1) =>
      KC_VIEWER_ROLES.some(
        (item2) => item2.toLowerCase() === item1.toLowerCase()
      )
    )
  ) {
    return 'Viewer'
  }
  return null
}

const enableKeycloakOauth = (app, config, services) => {
  const { baseUriPath } = config.server
  const { userService, accessService } = services

  passport.use(
    'keycloak',
    new KeycloakStrategy(
      {
        host: KC_HOST,
        realm: KC_REALM,
        clientID: KC_CLIENT_ID,
        clientSecret: KC_CLIENT_SECRET,
        callbackURL: `${baseUriPath}/api/auth/callback`,
        authorizationURL: `${KC_HOST}/realms/${KC_REALM}/protocol/openid-connect/auth`,
        tokenURL: `${KC_HOST}/realms/${KC_REALM}/protocol/openid-connect/token`,
        userInfoURL: `${KC_HOST}/realms/${KC_REALM}/protocol/openid-connect/userinfo`
      },

      async (accessToken, refreshToken, profile, done) => {
        console.log(`username: ${profile.username} roles: ${profile.roles}`)

        const role = getRole(profile.roles || [])
        if (!role) {
          // Not authorized
          console.log('Not authorized')
          done(null, false)
          return
        }
        console.log('user role', role)

        const user = await userService.loginUserSSO({
          email: profile.email,
          name: profile.fullName,
          autoCreate: true
        })
        await accessService.setUserRootRole(user.id, role)

        done(null, user)
      }
    )
  )

  app.use(passport.initialize())
  app.use(passport.session())

  passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((user, done) => done(null, user))

  app.get('/api/admin/login', passport.authenticate('keycloak'))

  app.get(
    '/api/auth/callback',
    passport.authenticate('keycloak', {
      failureRedirect: `${baseUriPath}/api/admin/error-login`
    }),
    (req, res) => {
      res.redirect(`${baseUriPath}/`)
    }
  )

  app.use('/api', (req, res, next) => {
    if (req.user) {
      return next()
    }
    // Instruct unleash-frontend to pop-up auth dialog
    return res
      .status(401)
      .json(
        new AuthenticationRequired({
          path: `${baseUriPath}/api/admin/login`,
          type: 'custom',
          message: 'You have to identify yourself in order to use Unleash. Click the button and follow the instructions.'
        })
      )
      .end()
  })
}

module.exports = {
  enableKeycloakOauth,
  getRole
}
