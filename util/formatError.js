const formatError = (status, msg) => {
    if (!status || !msg || !parseInt(status)) {
        let error = new Error('Error occured')
        error.statusCode = 500
        throw error
    } else {
        let error = new Error(msg)
        error.statusCode = status
        throw error
    }
}

export default formatError
