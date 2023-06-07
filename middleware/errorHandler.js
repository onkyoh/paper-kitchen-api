const errorHandler = (err, req, res, next) => {
    res.status(err.statusCode).send({ msg: err.message })
}

export default errorHandler
