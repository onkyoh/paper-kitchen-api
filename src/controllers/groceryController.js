import prisma from '../config/db.js'
import jwt from 'jsonwebtoken'
import {
    groceryQuerySchema,
    updateGrocerySchema,
} from '../validations/groceryValidation.js'
import {
    updateShareSchema,
    shareUrlSchema,
    createListSchema,
    removeShareSchema,
} from '../validations/schemas/sharedSchemas.js'
import formatError from '../util/formatError.js'
import generateToken from '../util/generateToken.js'

export const getGroceryLists = async (req, res) => {
    const { error } = groceryQuerySchema.validate(req.query)

    if (error) {
        formatError(400, error.details[0].message)
    }

    const { page, pageSize } = req.query

    const skip = page ? (parseInt(page) - 1) * parseInt(pageSize) : undefined
    const take = pageSize ? parseInt(pageSize) : undefined

    const groceries = await prisma.groceryList.findMany({
        where: {
            userGroceryLists: {
                some: {
                    userId: req.userId,
                },
            },
        },
        skip,
        take,
    })

    if (groceries) {
        return res.status(200).send(groceries)
    }
    formatError(500, 'Error getting grocery lists')
}
export const createGroceryList = async (req, res) => {
    const { error } = createListSchema.validate(req.body)

    if (error) {
        formatError(400, error.details[0].message)
    }

    const groceryList = await prisma.groceryList.create({
        data: {
            ...req.body,
            ownerId: req.userId,
            ingredients: [],
            type: 'grocery',
        },
    })

    if (groceryList) {
        const userGroceryList = await prisma.userGroceryList.create({
            data: {
                userId: groceryList.ownerId,
                groceryListId: groceryList.id,
                canEdit: true,
            },
        })
    }

    if (groceryList) {
        return res.status(201).send(groceryList)
    }
    formatError(500, 'Error creating grocery list')
}

export const updateGroceryList = async (req, res) => {
    const { error } = updateGrocerySchema.validate(req.body)

    if (error) {
        formatError(400, error.details[0].message)
    }

    const id = parseInt(req.params.id)

    if (!id) {
        formatError(400, 'Grocery list id is required')
    }

    const canEdit = await prisma.userGroceryList.findFirst({
        where: {
            userId: req.userId,
            groceryListId: id,
            canEdit: true,
        },
    })

    if (!canEdit) {
        formatError(403, 'You are not authorized to update this grocery list')
    }

    const updatedGroceryList = await prisma.groceryList.update({
        where: { id },
        data: req.body,
    })

    if (updatedGroceryList) {
        return res.status(200).send(updatedGroceryList)
    }
    formatError(500, 'Error updating grocery list')
}

export const deleteGroceryList = async (req, res) => {
    const id = parseInt(req.params.id)

    if (!id) {
        formatError(400, 'Grocery list id is required')
    }

    const canDelete = await prisma.groceryList.findFirst({
        where: {
            id,
            ownerId: req.userId,
        },
    })

    if (!canDelete) {
        formatError(403, 'You are not authorized to delete this grocery list')
    }

    await prisma.userGroceryList.deleteMany({
        where: {
            groceryListId: id,
        },
    })

    const deletedGroceryList = await prisma.groceryList.deleteMany({
        where: {
            id: id,
            ownerId: req.userId,
        },
    })

    if (deletedGroceryList.count === 1) {
        res.status(200).send('Succesfully deleted')
    }
    formatError(500, 'Error deleting grocery list')
}

export const makeShareUrl = async (req, res) => {
    const { error } = shareUrlSchema.validate({ ...req.body, ...req.params })

    if (error) {
        formatError(400, error.details[0].message)
    }

    const { id } = req.params

    //check if req.userId has canEdit true in junction table = permission to add
    const canEdit = await prisma.userGroceryList.findFirst({
        where: {
            userId: req.userId,
            groceryListId: parseInt(id),
            canEdit: true,
        },
    })

    if (!canEdit) {
        formatError(403, 'You are not authorized to share this grocery list')
    }

    //return a url that encodes which groceryList and the permission being given

    const groceryListOwner = await prisma.user.findUnique({
        where: {
            id: req.userId,
        },
        select: {
            name: true,
        },
    })

    if (!groceryListOwner) {
        formatError(500, 'Error getting owner name')
    }

    const url = jwt.sign(
        {
            title: req.body.title,
            owner: groceryListOwner.name,
            groceryListId: parseInt(id),
            canEdit: req.body.canEdit,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '2h',
        }
    )

    return res.status(200).send(url)
}

export const joinGroceryList = async (req, res) => {
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
            canEdit: decodedUrl.canEdit,
            userId: req.userId,
        },
    })

    return res.status(201).send('Succesfully joined')
}

export const updateShare = async (req, res) => {
    const { error } = updateShareSchema.validate({ ...req.body, ...req.params })

    if (error) {
        formatError(400, error.details[0].message)
    }

    const { id } = req.params

    const isOwner = await prisma.groceryList.findFirst({
        where: {
            id: parseInt(id),
            userId: req.userId,
        },
    })

    if (!isOwner) {
        formatError(403, 'Unauthorized')
    }

    const updatedPermission = await prisma.userGroceryList.update({
        where: {
            groceryListId: parseInt(id),
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

    const isOwner = await prisma.groceryList.findFirst({
        where: {
            id: parseInt(id),
            ownerId: req.userId,
        },
    })

    if (!isOwner) {
        formatError(403, 'Unauthorized')
    }

    await prisma.userGroceryList.delete({
        where: {
            id: parseInt(id),
            userId: req.body.userId,
        },
    })

    return res.status(200).send('User removed')
}
