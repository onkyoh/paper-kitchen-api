import prisma from '../config/db.js'
import formatError from '../util/formatError.js'
import decodeUrl from '../util/decodeUrl.js'

const models = {
    recipeId: {
        model: 'recipe',
        userModel: 'userRecipe',
        redirect: '/recipes',
        canEdit: false,
    },
    groceryListId: {
        model: 'groceryList',
        userModel: 'userGroceryList',
        redirect: '/grocery-lists',
        canEdit: true,
    },
}

export const getJoinInfo = async (req, res) => {
    const { url } = req.params
    const decodedUrl = await decodeUrl(url)
    const idKey = Object.keys(decodedUrl)[0]
    const model = models[idKey]

    if (!model) {
        return formatError(400, 'Invalid URL')
    }

    const data = await prisma[model.model].findUnique({
        where: { id: decodedUrl[idKey] },
    })

    if (!data) {
        return formatError(400, `${model.model} not found`)
    }

    return res.status(200).send(data)
}

export const join = async (req, res) => {
    const { url } = req.params
    const decodedUrl = await decodeUrl(url)
    const idKey = Object.keys(decodedUrl)[0]
    const model = models[idKey]

    if (!model) {
        return formatError(500, 'Error joining')
    }

    const existingAccess = await prisma[model.userModel].findFirst({
        where: {
            userId: req.userId,
            [idKey]: decodedUrl[idKey],
        },
    })

    if (existingAccess) {
        return formatError(400, 'Already joined')
    }

    await prisma[model.userModel].create({
        data: {
            [idKey]: decodedUrl[idKey],
            canEdit: model.canEdit,
            userId: req.userId,
        },
    })

    return res.status(201).send(model.redirect)
}
