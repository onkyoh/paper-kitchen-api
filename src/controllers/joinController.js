import prisma from '../config/db.js'
import formatError from '../util/formatError.js'
import decodeUrl from '../util/decodeUrl.js'

export const getJoinInfo = async (req, res) => {
    const { url } = req.params

    let decodedUrl = await decodeUrl(url)

    if ('recipeId' in decodedUrl) {
        const recipe = await prisma.recipe.findUnique({
            where: {
                id: decodedUrl.recipeId,
            },
        })

        if (!recipe) {
            formatError(400, 'Recipe not found')
        }

        return res.status(200).send(recipe)
    } else {
        const groceryList = await prisma.groceryList.findUnique({
            where: {
                id: decodedUrl.groceryListId,
            },
        })

        if (!groceryList) {
            formatError(400, 'Grocery list not found')
        }

        return res.status(200).send(groceryList)
    }
}

export const join = async (req, res) => {
    const { url } = req.params

    let decodedUrl = await decodeUrl(url)

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
