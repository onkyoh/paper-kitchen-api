import {
    recipesQuerySchema,
    updateRecipeSchema,
} from '../validations/recipeValidation.js'
import {
    updateShareSchema,
    shareUrlSchema,
    createListSchema,
    removeShareSchema,
} from '../validations/schemas/sharedSchemas.js'
import formatError from '../util/formatError.js'
import prisma from '../config/db.js'
import jwt from 'jsonwebtoken'
import generateToken from '../util/generateToken.js'

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

    if (isOwner) {
        where.ownerId = req.userId
    }

    if (maxCookingTime) {
        where.cookingTime = { lte: parseInt(maxCookingTime) }
    }

    if (maxCost) {
        where.cost = { lte: parseInt(maxCost) }
    }

    if (serves) {
        where.serves = { gte: parseInt(serves) }
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

    const skip = page ? (parseInt(page) - 1) * parseInt(pageSize) : undefined
    const take = pageSize ? parseInt(pageSize) : undefined

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
    })

    if (recipes) {
        return res.status(200).send(recipes)
    }
    formatError(500, 'Error getting recipes')
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
    const { error } = shareUrlSchema.validate({ ...req.body, ...req.params })

    if (error) {
        formatError(400, error.details[0].message)
    }

    const { id } = req.params

    //check if req.userId has canEdit true in junction table = permission to add
    const canEdit = await prisma.userRecipe.findFirst({
        where: {
            userId: req.userId,
            recipeId: parseInt(id),
            canEdit: true,
        },
    })

    if (!canEdit) {
        formatError(403, 'You are not authorized to share this recipe')
    }

    //return a url that encodes which recipe and the permission being given

    const recipeOwner = await prisma.user.findUnique({
        where: {
            id: req.userId,
        },
        select: {
            name: true,
        },
    })

    if (!recipeOwner) {
        formatError(500, 'Error getting owner name')
    }

    const url = jwt.sign(
        {
            title: req.body.title,
            owner: recipeOwner.name,
            recipeId: parseInt(id),
            canEdit: req.body.canEdit,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '2h',
        }
    )

    return res.status(200).send(url)
}

export const joinRecipe = async (req, res) => {
    const { url } = req.params

    let decodedUrl = null

    jwt.verify(url, process.env.JWT_SECRET, (err, decoded) => {
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
            canEdit: decodedUrl.canEdit,
            userId: req.userId,
        },
    })

    return res.status(201).send('Successfully joined')
}

export const updateShare = async (req, res) => {
    const { error } = updateShareSchema.validate({ ...req.body, ...req.params })

    if (error) {
        formatError(400, error.details[0].message)
    }

    const { id } = req.params

    const isOwner = await prisma.recipe.findFirst({
        where: {
            id: parseInt(id),
            ownerId: req.userId,
        },
    })

    if (!isOwner) {
        formatError(403, 'Unauthorized')
    }

    const updatedPermission = await prisma.userRecipe.updateMany({
        where: {
            recipeId: parseInt(id),
            userId: req.body.userId,
        },
        data: {
            canEdit: req.body.canEdit,
        },
    })

    return res.status(200).send('Permissions updated')
}

export const removeShare = async (req, res) => {
    const { error } = removeShareSchema.validate({ ...req.body, ...req.params })

    if (error) {
        formatError(400, error.details[0].message)
    }

    const { id } = req.params

    const isOwner = await prisma.recipe.findFirst({
        where: {
            id: parseInt(id),
            ownerId: req.userId,
        },
    })

    if (!isOwner) {
        formatError(403, 'Unauthorized')
    }

    await prisma.userRecipe.deleteMany({
        where: {
            recipeId: parseInt(id),
            userId: req.body.userId,
        },
    })

    return res.status(200).send('User removed')
}
