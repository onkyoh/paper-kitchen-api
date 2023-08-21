import prisma from '../config/db.js'
import jwt from 'jsonwebtoken'
import formatError from '../util/formatError.js'

export const getJoinInfo = async (req, res) => {
    const { url } = req.params

    let decodedUrl = null

    if (/^[0-9A-Fa-f]{8}$/.test(url) === false) {
        formatError(400, 'Link is not valid')
    }

    const { jwtString } = await prisma.url.findUnique({
        where: {
            id: url,
        },
    })

    if (!jwtString) {
        formatError(400, 'Link is not valid')
    }

    jwt.verify(jwtString, process.env.JWT_SECRET, (err, decoded) => {
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

    return res.status(200).send(decodedUrl)
}

export const join = async (req, res) => {
    const { url } = req.params

    let decodedUrl = null

    if (/^[0-9A-Fa-f]{8}$/.test(url) === false) {
        formatError(400, 'Link is not valid')
    }

    const { jwtString } = await prisma.url.findUnique({
        where: {
            id: url,
        },
    })

    if (!jwtString) {
        formatError(400, 'Link is not valid')
    }

    jwt.verify(jwtString, process.env.JWT_SECRET, (err, decoded) => {
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

    if ('recipeId' in decodedUrl) {
        const existingAccess = await prisma.userRecipe.findFirst({
            where: {
                userId: req.userId,
                recipeId: decodedUrl.recipeId,
            },
        })

        if (existingAccess) {
            formatError(400, 'Already joined')
        }

        const newShare = await prisma.userRecipe.create({
            data: {
                recipeId: decodedUrl.recipeId,
                canEdit: false,
                userId: req.userId,
            },
        })

        return res.status(201).send('/recipes')
    }

    if ('groceryListId' in decodedUrl) {
        const existingAccess = await prisma.userGroceryList.findFirst({
            where: {
                userId: req.userId,
                groceryListId: decodedUrl.groceryListId,
            },
        })

        if (existingAccess) {
            formatError(400, 'Already joined')
        }

        const newShare = await prisma.userGroceryList.create({
            data: {
                groceryListId: decodedUrl.groceryListId,
                canEdit: true,
                userId: req.userId,
            },
        })

        return res.status(201).send('/grocery-lists')
    }

    formatError(500, 'Error joining')
}
