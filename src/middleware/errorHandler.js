const errorHandler = (err, req, res, next) => {
    if (err.statusCode && err.message) {
        return res.status(err.statusCode).send({ msg: err.message })
    } else {
        return res.status(500).send({ msg: 'An error occured' })
    }
}

export default errorHandler
