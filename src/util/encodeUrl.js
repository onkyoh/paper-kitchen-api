import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import prisma from '../config/db.js'
import formatError from './formatError.js'

const encodeUrl = async (payload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '2h',
    })

    const url = randomBytes(4).toString('hex')

    const urlData = await prisma.url.create({
        data: {
            id: url,
            jwtString: token,
        },
    })

    return urlData.id
}

export default encodeUrl
