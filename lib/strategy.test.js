const jwt = require('jsonwebtoken')
const jwksRsa = require('jwks-rsa')
const Strategy = require('./strategy')

jest.mock('jsonwebtoken')
jest.mock('jwks-rsa')

const BASE_OPTIONS = {
  issuer: 'http://localhost:8080/auth/realms/test-realm',
  clientID: 'client-id',
  clientSecret: 'client-secret',
  callbackURL: 'http://localhost:4242/callback',
  authorizationURL: 'http://localhost:8080/auth/realms/test-realm/protocol/openid-connect/auth',
  tokenURL: 'http://localhost:8080/auth/realms/test-realm/protocol/openid-connect/token',
  userInfoURL: 'http://localhost:8080/auth/realms/test-realm/protocol/openid-connect/userinfo'
}

const SAMPLE_PAYLOAD = {
  sub: 'user-123',
  name: 'Test User',
  given_name: 'Test',
  family_name: 'User',
  preferred_username: 'testuser',
  email: 'test@example.com',
  realm_access: { roles: ['editor'] }
}

describe('Strategy', () => {
  let mockGetSigningKey
  let mockGetPublicKey

  beforeEach(() => {
    mockGetPublicKey = jest.fn().mockReturnValue('public-key')
    mockGetSigningKey = jest.fn((kid, cb) => cb(null, { getPublicKey: mockGetPublicKey }))
    jwksRsa.mockReturnValue({ getSigningKey: mockGetSigningKey })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('initialises a JWKS client pointed at the Keycloak certs endpoint', () => {
    new Strategy(BASE_OPTIONS, jest.fn()) // eslint-disable-line no-new
    expect(jwksRsa).toHaveBeenCalledWith(expect.objectContaining({
      jwksUri: 'http://localhost:8080/auth/realms/test-realm/protocol/openid-connect/certs'
    }))
  })

  it('calls jwt.verify (not jwt.decode) with issuer option', (done) => {
    jwt.verify.mockImplementation((token, getKey, opts, cb) => cb(null, SAMPLE_PAYLOAD))
    const strategy = new Strategy(BASE_OPTIONS, jest.fn())

    strategy.userProfile('token', (err, profile) => {
      expect(err).toBeNull()
      expect(jwt.verify).toHaveBeenCalledWith(
        'token',
        expect.any(Function),
        expect.objectContaining({ issuer: 'http://localhost:8080/auth/realms/test-realm' }),
        expect.any(Function)
      )
      expect(jwt.decode).not.toHaveBeenCalled()
      done()
    })
  })

  it('maps verified token claims to userInfo profile', (done) => {
    jwt.verify.mockImplementation((token, getKey, opts, cb) => cb(null, SAMPLE_PAYLOAD))
    const strategy = new Strategy(BASE_OPTIONS, jest.fn())

    strategy.userProfile('token', (err, profile) => {
      expect(err).toBeNull()
      expect(profile).toMatchObject({
        keycloakId: 'user-123',
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['editor']
      })
      done()
    })
  })

  it('forwards jwt.verify errors to done', (done) => {
    const verifyError = new Error('invalid signature')
    jwt.verify.mockImplementation((token, getKey, opts, cb) => cb(verifyError))
    const strategy = new Strategy(BASE_OPTIONS, jest.fn())

    strategy.userProfile('bad-token', (err) => {
      expect(err).toBe(verifyError)
      done()
    })
  })

  it('forwards JWKS key retrieval errors to done', (done) => {
    const keyError = new Error('key not found')
    mockGetSigningKey.mockImplementation((kid, cb) => cb(keyError))
    jwt.verify.mockImplementation((token, getKey, opts, cb) => {
      // simulate jwks callback being invoked internally
      getKey({ kid: 'kid-1' }, (err) => { if (err) cb(err) })
    })
    const strategy = new Strategy(BASE_OPTIONS, jest.fn())

    strategy.userProfile('token', (err) => {
      expect(err).toBe(keyError)
      done()
    })
  })

  it('throws if a required option is missing', () => {
    const { clientID, ...withoutClientId } = BASE_OPTIONS
    expect(() => new Strategy(withoutClientId, jest.fn())).toThrow('clientID is required')
  })
})
