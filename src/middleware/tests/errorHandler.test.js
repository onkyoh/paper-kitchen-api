import errorHandler from '../errorHandler'

describe('errorHandler', () => {
    it('should return an error with the passed-in status code and message', async () => {
        const mockReq = {}
        const mockRes = {
            status: jest.fn(() => mockRes),
            send: jest.fn(),
        }
        const mockNext = jest.fn()

        const err = {
            statusCode: 404,
            message: 'Route not found',
        }

        errorHandler(err, mockReq, mockRes, mockNext)

        expect(mockRes.status).toHaveBeenCalledWith(404)
        expect(mockRes.send).toHaveBeenCalledWith('Route not found')
        expect(mockNext).not.toHaveBeenCalled()
    })

    it('should return a 500 error if statusCode or message is missing', async () => {
        const mockReq = {}
        const mockRes = {
            status: jest.fn(() => mockRes),
            send: jest.fn(),
        }
        const mockNext = jest.fn()

        const err = {}

        errorHandler(err, mockReq, mockRes, mockNext)

        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.send).toHaveBeenCalledWith('An error occurred')
        expect(mockNext).not.toHaveBeenCalled()
    })
})
