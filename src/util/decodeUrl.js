import jwt from 'jsonwebtoken'
import formatError from '../util/formatError.js'
import prisma from '../config/db.js'

const decodeUrl = async (url) => {
    if (/^[0-9A-Fa-f]{8}$/.test(url) === false) {
        formatError(400, 'Link is not valid')
    }

    const urlData = await prisma.url.findUnique({
        where: {
            id: url,
        },
    })

    if (!urlData) {
        formatError(400, 'Link is not valid')
    }

    let decodedUrl = null

    jwt.verify(urlData.jwtString, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                formatError(400, 'Link has expired')
            } else {
                formatError(400, 'Link is not valid')
            }
        } else {
            decodedUrl = { ...decoded }
        }
    })

    //delete all url db entries older than 2 hours

    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    await prisma.url.deleteMany({
        where: {
            createdAt: {
                lt: tenDaysAgo,
            },
        },
    })

    return decodedUrl
}

export default decodeUrl
