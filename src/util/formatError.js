const formatError = (status, msg) => {
    if (!status || !msg || !parseInt(status)) {
        let error = new Error('Error occurred')
        error.statusCode = 500
        throw error
    } else {
        let error = new Error(msg.replace(/["\\]/g, ''))
        error.statusCode = status
        throw error
    }
}

export default formatError
