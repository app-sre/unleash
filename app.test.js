const request = require('supertest')
const express = require('express')

jest.mock('./env')
jest.mock('passport')

const { enableKeycloakOauth, getRole } = require('./app')

describe('test app', () => {
  let app
  const baseUriPath = 'http://localhost:4242'

  beforeEach(() => {
    app = express()
    const config = { server: { baseUriPath } }
    const services = {
      userService: {
        loginUserSSO: jest.fn()
      },
      accessService: {
        setUserRootRole: jest.fn()
      }
    }
    enableKeycloakOauth(app, config, services)
    app.get('/api/admin/projects', (req, res) => {
      res.sendStatus(200)
    })
    app.get('/api/client/features', (req, res) => {
      res.sendStatus(200)
    })
  })

  it('should return 401 without admin access token', async () => {
    const response = await request(app).get('/api/admin/projects')
    expect(response.statusCode).toBe(401)
  })

  it('should return 401 without client access token', async () => {
    const response = await request(app).get('/api/client/features')
    expect(response.statusCode).toBe(401)
  })

  it('should redirect to base after auth', async () => {
    const response = await request(app).get('/api/auth/callback')
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${baseUriPath}/`)
  })
})

describe('test getRole', () => {
  it.each([
    [['admin'], 'Admin'],
    [['editor'], 'Editor'],
    [['viewer'], 'Viewer']
  ])('getRole(%p) to return %s', (input, expected) => {
    expect(getRole(input)).toBe(expected)
  })
})
