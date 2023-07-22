import formatError from '../formatError.js'

describe('formatError', () => {
    it('should throw an error with status code 500 if status, msg, or parsed status is missing', () => {
        expect(() => {
            formatError()
        }).toThrow('Error occurred')

        expect(() => {
            formatError()
        }).toThrow('Error occurred')

        expect(() => {
            formatError('InvalidStatus', 'Message')
        }).toThrow('Error occurred')
    })

    it('should throw an error with the provided status code and message', () => {
        expect(() => {
            formatError(404, 'Route not found')
        }).toThrow('Route not found')

        expect(() => {
            formatError(401, 'Unauthorized')
        }).toThrow('Unauthorized')
    })
})
