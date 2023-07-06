"use strict";

const unleash = require("unleash-server");
const KeycloakStrategy = require("./lib/strategy.js");
const passport = require("passport");

const DATABASE_HOST = process.env.DATABASE_HOST;
const DATABASE_USERNAME = process.env.DATABASE_USERNAME;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_NAME = process.env.DATABASE_NAME;
const ADMIN_ACCESS_TOKEN = process.env.ADMIN_ACCESS_TOKEN;
const CLIENT_ACCESS_TOKEN = process.env.CLIENT_ACCESS_TOKEN;
const SESSION_SECRET = process.env.SESSION_SECRET;
const KC_HOST = process.env.KC_HOST;
const KC_REALM = process.env.KC_REALM;
const KC_CLIENT_ID = process.env.KC_CLIENT_ID;
const KC_CLIENT_SECRET = process.env.KC_CLIENT_SECRET;
const KC_ADMIN_ROLES = (process.env.KC_ADMIN_ROLES || "")
  .split(",")
  .map(function (item) {
    return item.trim();
  });
const KC_EDITOR_ROLES = (process.env.KC_EDITOR_ROLES || "")
  .split(",")
  .map(function (item) {
    return item.trim();
  });
var KC_VIEWER_ROLES = (process.env.KC_VIEWER_ROLES || "")
  .split(",")
  .map(function (item) {
    return item.trim();
  });

if (!DATABASE_HOST) {
  throw new Error("DATABASE_HOST not set!");
}
if (!DATABASE_USERNAME) {
  throw new Error("DATABASE_USERNAME not set!");
}
if (!DATABASE_PASSWORD) {
  throw new Error("DATABASE_PASSWORD not set!");
}
if (!DATABASE_NAME) {
  throw new Error("DATABASE_NAME not set!");
}
if (!KC_HOST) {
  throw new Error("KC_HOST not set!");
}
if (!KC_REALM) {
  throw new Error("KC_REALM not set!");
}
if (!KC_CLIENT_ID) {
  throw new Error("KC_CLIENT_ID not set!");
}
if (!KC_CLIENT_SECRET) {
  throw new Error("KC_CLIENT_SECRET not set!");
}
if (!ADMIN_ACCESS_TOKEN) {
  throw new Error("ADMIN_ACCESS_TOKEN not set!");
}
if (!CLIENT_ACCESS_TOKEN) {
  throw new Error("CLIENT_ACCESS_TOKEN not set!");
}
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET not set!");
}

function enableKeycloakOauth(app, config, services) {
  const { baseUriPath } = config.server;
  const { userService, accessService } = services;

  passport.use(
    "keycloak",
    new KeycloakStrategy(
      {
        host: KC_HOST,
        realm: KC_REALM,
        clientID: KC_CLIENT_ID,
        clientSecret: KC_CLIENT_SECRET,
        callbackURL: `${baseUriPath}/api/auth/callback`,
        authorizationURL: `${KC_HOST}/realms/${KC_REALM}/protocol/openid-connect/auth`,
        tokenURL: `${KC_HOST}/realms/${KC_REALM}/protocol/openid-connect/token`,
        userInfoURL: `${KC_HOST}/realms/${KC_REALM}/protocol/openid-connect/userinfo`,
      },

      async (accessToken, refreshToken, profile, done) => {
        console.log("profile", profile);

        const user_roles = profile.roles || [];
        const isAdmin = user_roles.some((item1) =>
          KC_ADMIN_ROLES.some(
            (item2) => item2.toLowerCase() === item1.toLowerCase()
          )
        );
        const isEditor = user_roles.some((item1) =>
          KC_EDITOR_ROLES.some(
            (item2) => item2.toLowerCase() === item1.toLowerCase()
          )
        );
        const isViewer = user_roles.some((item1) =>
          KC_VIEWER_ROLES.some(
            (item2) => item2.toLowerCase() === item1.toLowerCase()
          )
        );

        if (isAdmin) {
          var role = "Admin";
        } else if (isEditor) {
          var role = "Editor";
        } else if (isViewer) {
          var role = "Viewer";
        } else {
          // Not authorized
          console.log("Not authorized");
          done(null, false);
          return;
        }
        console.log("user role", role);

        const user = await userService.loginUserSSO({
          email: profile.email,
          name: profile.fullName,
          autoCreate: true,
        });
        await accessService.setUserRootRole(user.id, role);

        done(null, user);
      }
    )
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.get("/api/admin/login", passport.authenticate("keycloak"));

  app.get(
    "/api/auth/callback",
    passport.authenticate("keycloak", {
      failureRedirect: `${baseUriPath}/api/admin/error-login`,
    }),
    (req, res) => {
      res.redirect(`${baseUriPath}/`);
    }
  );

  app.use("/api/admin/", (req, res, next) => {
    if (req.user) {
      return next();
    } else if (
      req.header("authorization") === `Bearer ${ADMIN_ACCESS_TOKEN}` ||
      req.header("authorization") === `${ADMIN_ACCESS_TOKEN}`
    ) {
      return next();
    }
    // Instruct unleash-frontend to pop-up auth dialog
    return res
      .status(401)
      .json(
        new unleash.AuthenticationRequired({
          path: `${baseUriPath}/api/admin/login`,
          type: "custom",
          message: `You have to identify yourself in order to use Unleash. Click the button and follow the instructions.`,
        })
      )
      .end();
  });
  app.use("/api/client", (req, res, next) => {
    if (
      req.header("authorization") === `Bearer ${CLIENT_ACCESS_TOKEN}` ||
      req.header("authorization") === `${CLIENT_ACCESS_TOKEN}`
    ) {
      next();
    } else {
      res.sendStatus(401);
    }
  });
}

const options = {
  enableLegacyRoutes: false,
  secret: SESSION_SECRET,
  authentication: {
    type: "custom",
    customAuthHandler: enableKeycloakOauth,
  },
  server: {
    enableRequestLogger: true,
    baseUriPath: "",
  },
  logLevel: "info",
};

unleash.start(options).then((instance) => {
  console.log(
    `Unleash started on http://localhost:${instance.app.get("port")}`
  );
});
