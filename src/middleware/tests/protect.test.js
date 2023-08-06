import jwt from 'jsonwebtoken'
import protect from '../protect'
import formatError from '../../util/formatError.js'

jest.mock('../../util/formatError.js')

describe('protect middleware', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should call next() if a valid token is provided', () => {
        const mockReq = {
            headers: {
                authorization: 'Bearer valid_token',
            },
        }
        const mockRes = {}
        const mockNext = jest.fn()

        const jwtVerifyMock = jest.spyOn(jwt, 'verify')
        jwtVerifyMock.mockImplementation((token, secret, callback) => {
            callback(null, { id: 123 })
        })

        protect(mockReq, mockRes, mockNext)

        expect(mockReq.userId).toEqual(123)
        expect(mockNext).toHaveBeenCalled()

        jwtVerifyMock.mockRestore()
    })

    it('should call formatError with status code 401 if no token is provided', () => {
        const mockReq = {
            headers: {},
        }
        const mockRes = {}
        const mockNext = jest.fn()

        formatError.mockImplementation((statusCode, message) => {
            throw new Error(`Error ${statusCode}: ${message}`)
        })

        expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
            'Error 401: Unauthorized'
        )

        expect(mockNext).not.toHaveBeenCalled()
    })

    it('should call formatError with status code 401 if an invalid token is provided', () => {
        const mockReq = {
            headers: {
                authorization: 'Bearer invalid_token',
            },
        }
        const mockRes = {}
        const mockNext = jest.fn()

        const jwtVerifyMock = jest.spyOn(jwt, 'verify')
        jwtVerifyMock.mockImplementation((token, secret, callback) => {
            callback(new Error('Invalid token'))
        })

        formatError.mockImplementation((statusCode, message) => {
            throw new Error(`Error ${statusCode}: ${message}`)
        })

        expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
            'Error 401: Unauthorized'
        )

        expect(mockNext).not.toHaveBeenCalled()

        jwtVerifyMock.mockRestore()
    })
})
