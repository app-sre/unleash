const DATABASE_HOST = process.env.DATABASE_HOST
const DATABASE_USERNAME = process.env.DATABASE_USERNAME
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD
const DATABASE_NAME = process.env.DATABASE_NAME
const KC_HOST = process.env.KC_HOST
const KC_REALM = process.env.KC_REALM
const KC_CLIENT_ID = process.env.KC_CLIENT_ID
const KC_CLIENT_SECRET = process.env.KC_CLIENT_SECRET
const KC_ADMIN_ROLES = (process.env.KC_ADMIN_ROLES || '')
  .split(',')
  .map(function (item) {
    return item.trim()
  })
const KC_EDITOR_ROLES = (process.env.KC_EDITOR_ROLES || '')
  .split(',')
  .map(function (item) {
    return item.trim()
  })
const KC_VIEWER_ROLES = (process.env.KC_VIEWER_ROLES || '')
  .split(',')
  .map(function (item) {
    return item.trim()
  })

if (!DATABASE_HOST) {
  throw new Error('DATABASE_HOST not set!')
}
if (!DATABASE_USERNAME) {
  throw new Error('DATABASE_USERNAME not set!')
}
if (!DATABASE_PASSWORD) {
  throw new Error('DATABASE_PASSWORD not set!')
}
if (!DATABASE_NAME) {
  throw new Error('DATABASE_NAME not set!')
}
if (!KC_HOST) {
  throw new Error('KC_HOST not set!')
}
if (!KC_REALM) {
  throw new Error('KC_REALM not set!')
}
if (!KC_CLIENT_ID) {
  throw new Error('KC_CLIENT_ID not set!')
}
if (!KC_CLIENT_SECRET) {
  throw new Error('KC_CLIENT_SECRET not set!')
}

module.exports = {
  DATABASE_HOST,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  KC_HOST,
  KC_REALM,
  KC_CLIENT_ID,
  KC_CLIENT_SECRET,
  KC_ADMIN_ROLES,
  KC_EDITOR_ROLES,
  KC_VIEWER_ROLES
}
