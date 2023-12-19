import {
    recipesQuerySchema,
    updateRecipeSchema,
} from '../validations/recipeValidation.js'
import {
    updateShareSchema,
    createListSchema,
    removeShareSchema,
} from '../validations/schemas/sharedSchemas.js'
import formatError from '../util/formatError.js'
import encodeUrl from '../util/encodeUrl.js'
import prisma from '../config/db.js'

export const getRecipes = async (req, res) => {
    const { error } = recipesQuerySchema.validate(req.query)

    if (error) {
        formatError(400, error.details[0].message)
    }

    const {
        isOwner,
        maxCookingTime,
        maxCost,
        serves,
        favourite,
        ingredients,
        page,
        pageSize,
    } = req.query

    let where = {}

    function notZeroString(string) {
        return parseInt(string) === 0 ? false : true
    }

    if (isOwner === 'true') {
        where.ownerId = req.userId
    }

    if (maxCookingTime && notZeroString(maxCookingTime)) {
        where.cookingTime = { lte: +maxCookingTime }
    }

    if (maxCost && notZeroString(maxCost)) {
        where.cost = { lte: +maxCost }
    }

    if (serves && notZeroString(serves)) {
        where.serves = { gte: +serves }
    }

    if (favourite === 'true') {
        where.favourite = true
        where.ownerId = req.userId
    }

    if (ingredients) {
        where.ingredientsQuery = {
            hasSome: ingredients,
        }
    }

    const calculatedPage = parseInt(page) || 1
    const take = pageSize ? parseInt(pageSize) : 10
    const skip = (calculatedPage - 1) * parseInt(take)

    const recipes = await prisma.recipe.findMany({
        where: {
            ...where,
            userRecipes: {
                some: {
                    userId: req.userId,
                },
            },
        },
        skip,
        take,
        orderBy: {
            updatedAt: 'desc',
        },
    })

    if (recipes) {
        return res.status(200).send(recipes)
    }
    formatError(500, 'Error getting recipes')
}

export const getRecipe = async (req, res) => {
    const id = parseInt(req.params.id)

    if (!id) {
        formatError(400, 'Invalid recipe id')
    }

    const recipe = await prisma.recipe.findFirst({
        where: {
            id,
            userRecipes: {
                some: {
                    userId: req.userId,
                },
            },
        },
    })

    if (recipe) {
        return res.status(200).send(recipe)
    }

    formatError(401, 'Unauthorized')
}

export const createRecipe = async (req, res) => {
    const { error } = createListSchema.validate(req.body)

    if (error) {
        formatError(400, error.details[0].message)
    }

    const recipe = await prisma.recipe.create({
        data: {
            ...req.body,
            ownerId: req.userId,
            favourite: false,
            instructions: [],
            ingredients: [],
            ingredientsQuery: [],
            type: 'recipe',
        },
    })

    if (recipe) {
        const userRecipe = await prisma.userRecipe.create({
            data: {
                userId: recipe.ownerId,
                recipeId: recipe.id,
                canEdit: true,
            },
        })
    }

    if (recipe) {
        return res.status(201).send(recipe)
    }
    formatError(500, 'Error creating recipe')
}

export const updateRecipe = async (req, res) => {
    const { error } = updateRecipeSchema.validate(req.body)

    if (error) {
        formatError(400, error.details[0].message)
    }

    const id = parseInt(req.params.id)

    if (!id) {
        formatError(400, 'Recipe id is required')
    }

    const canEdit = await prisma.userRecipe.findFirst({
        where: {
            userId: req.userId,
            recipeId: id,
            canEdit: true,
        },
    })

    if (!canEdit) {
        formatError(403, 'You are not authorized to update this recipe')
    }

    const updatedRecipe = await prisma.recipe.update({
        where: { id },
        data: {
            ...req.body,
            updatedAt: undefined,
            ingredientsQuery: {
                set: req.body.ingredients.map((ingredient) => ingredient.name),
            },
        },
    })

    if (updatedRecipe) {
        return res.status(200).send(updatedRecipe)
    }
    formatError(500, 'Error updating recipe')
}

export const deleteRecipe = async (req, res) => {
    const id = parseInt(req.params.id)

    if (!id) {
        formatError(400, 'Recipe id is required')
    }

    const canDelete = await prisma.recipe.findFirst({
        where: {
            id,
            ownerId: req.userId,
        },
    })

    if (!canDelete) {
        formatError(403, 'You are not authorized to delete this recipe')
    }

    await prisma.userRecipe.deleteMany({
        where: {
            recipeId: id,
        },
    })

    const deletedRecipe = await prisma.recipe.deleteMany({
        where: {
            id: id,
            ownerId: req.userId,
        },
    })

    if (deletedRecipe.count === 1) {
        return res.status(200).send('Successfully deleted')
    }
    formatError(500, 'Error deleting recipe')
}

export const makeShareUrl = async (req, res) => {
    const id = parseInt(req.params.id)

    if (!id) {
        formatError(400, 'Id is required')
    }

    //check if req.userId has canEdit true in junction table = permission to add

    const canEdit = await prisma.userRecipe.findFirst({
        where: {
            userId: req.userId,
            recipeId: id,
            canEdit: true,
        },
    })

    if (!canEdit) {
        formatError(403, 'You are not authorized to share this recipe')
    }

    const url = await encodeUrl({ recipeId: id })

    if (url) {
        return res.status(200).send(url)
    }

    return formatError(500, 'Error creating copy link')
}

export const getShare = async (req, res) => {
    const recipeId = parseInt(req.params.id)

    if (!recipeId) {
        formatError(400, 'Valid recipe id required')
    }

    const isOwner = await prisma.recipe.findFirst({
        where: {
            id: recipeId,
            ownerId: req.userId,
        },
    })

    if (!isOwner) {
        formatError(403, 'Unauthorized')
    }

    const userIds = await prisma.userRecipe.findMany({
        where: {
            recipeId,
            NOT: {
                userId: req.userId,
            },
        },
        select: {
            userId: true,
            canEdit: true,
        },
    })

    const users = await prisma.user.findMany({
        where: {
            id: {
                in: userIds.map((userRecipe) => userRecipe.userId),
            },
        },
        select: {
            id: true,
            name: true,
        },
    })

    const usersWithCanEdit = userIds.map((userRecipe) => ({
        userId: userRecipe.userId,
        canEdit: userRecipe.canEdit,
        name: users.find((user) => user.id === userRecipe.userId).name,
    }))

    return res.status(200).send(usersWithCanEdit)
}

export const updateShare = async (req, res) => {
    const { error } = updateShareSchema.validate({ ...req.body, ...req.params })

    const { editingIds, deletingIds } = req.body

    const id = parseInt(req.params.id)

    if (error) {
        formatError(400, error.details[0].message)
    }

    const isOwner = await prisma.recipe.findFirst({
        where: {
            id,
            ownerId: req.userId,
        },
    })

    if (!isOwner) {
        formatError(403, 'Unauthorized')
    }

    if (editingIds.length > 0) {
        const userRecipes = await prisma.userRecipe.findMany({
            where: {
                userId: { in: editingIds },
                recipeId: id,
            },
        })

        const updated = await prisma.userRecipe.updateMany({
            where: {
                userId: { in: editingIds },
                recipeId: id,
            },
            data: {
                canEdit: !userRecipes[0].canEdit,
            },
        })
    }

    if (deletingIds.length > 0) {
        const deleted = await prisma.userRecipe.deleteMany({
            where: {
                recipeId: id,
                userId: {
                    in: deletingIds,
                },
            },
        })
    }

    return res.status(200).send('Permissions updated')
}

export const removeShare = async (req, res) => {
    const id = parseInt(req.params.id)

    if (!id) {
        formatError(400, 'Id is invalid')
    }

    await prisma.userRecipe.deleteMany({
        where: {
            recipeId: id,
            userId: req.userId,
        },
    })

    return res.status(200).send('You have been removed')
}
