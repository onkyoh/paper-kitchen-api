const errorHandler = (err, req, res, next) => {
    if (err.statusCode && err.message) {
        return res.status(err.statusCode).send(err.message)
    } else {
        return res.status(500).send('An error occurred')
    }
}

export default errorHandler
