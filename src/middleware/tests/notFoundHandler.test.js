import notFoundHandler from '../notFoundHandler'

describe('notFoundHandler', () => {
    it('should return a 404 error with "Route not found!" message', () => {
        const mockReq = {}
        const mockRes = {
            status: jest.fn(() => mockRes),
            json: jest.fn(),
        }
        const mockNext = jest.fn()

        notFoundHandler(mockReq, mockRes, mockNext)

        expect(mockRes.status).toHaveBeenCalledWith(404)
        expect(mockRes.json).toHaveBeenCalledWith('Route not found!')
        expect(mockNext).not.toHaveBeenCalled()
    })
})
