import jwt from 'jsonwebtoken'
import formatError from '../util/formatError.js'

const protect = (req, res, next) => {
    const token = req.cookies.access_token

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                formatError(401, 'Unauthorized')
            } else {
                req.userId = decoded.id
                next()
            }
        })
    } else {
        formatError(401, 'Unauthorized')
    }
}

export default protect
