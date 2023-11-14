const mockPassport = jest.createMockFromModule('passport')

mockPassport.initialize.mockImplementation(() => (req, res, next) => next())
mockPassport.session.mockImplementation(() => (req, res, next) => next())
mockPassport.authenticate.mockImplementation(() => (req, res, next) => next())

module.exports = mockPassport
