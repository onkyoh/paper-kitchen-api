const notFoundHandler = (req, res, next) => {
    res.status(404).json('Route not found!')
}

export default notFoundHandler
