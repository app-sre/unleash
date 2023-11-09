const request = require('supertest')
const express = require('express')

jest.mock('./env')
jest.mock('passport')

const { enableKeycloakOauth } = require('./app')
const { ADMIN_ACCESS_TOKEN, CLIENT_ACCESS_TOKEN } = require('./env')

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

  it('should return 404 with admin access token', async () => {
    const response = await request(app).get('/api/admin/projects').set('Authorization', ADMIN_ACCESS_TOKEN)
    expect(response.statusCode).toBe(200)
  })

  it('should return 401 without client access token', async () => {
    const response = await request(app).get('/api/client/features')
    expect(response.statusCode).toBe(401)
  })

  it('should return 404 without client access token', async () => {
    const response = await request(app).get('/api/client/features').set('Authorization', CLIENT_ACCESS_TOKEN)
    expect(response.statusCode).toBe(200)
  })

  it('should redirect to base after auth', async () => {
    const response = await request(app).get('/api/auth/callback')
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${baseUriPath}/`)
  })
})
