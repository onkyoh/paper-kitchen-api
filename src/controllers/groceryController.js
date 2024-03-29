import prisma from '../config/db.js'
import {
    groceryQuerySchema,
    updateGrocerySchema,
} from '../validations/groceryValidation.js'
import {
    updateShareSchema,
    createListSchema,
    removeShareSchema,
} from '../validations/schemas/sharedSchemas.js'
import formatError from '../util/formatError.js'
import encodeUrl from '../util/encodeUrl.js'

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

export const getGroceryList = async (req, res) => {
    const id = parseInt(req.params.id)

    if (!id) {
        formatError(400, 'Invalid grocery list id')
    }

    const groceryList = await prisma.groceryList.findFirst({
        where: {
            id,
            userGroceryLists: {
                some: {
                    userId: req.userId,
                },
            },
        },
    })

    if (groceryList) {
        return res.status(200).send(groceryList)
    }

    formatError(401, 'Unauthorized')
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

    const oldGroceryList = await prisma.groceryList.findFirst({
        where: { id },
    })

    let updatedIngredients = [...req.body.ingredients]
    const tempIngredients = [
        ...oldGroceryList.ingredients,
        ...req.body.ingredients,
    ]

    if (
        oldGroceryList &&
        new Date(oldGroceryList.updatedAt) > new Date(req.body.updatedAt)
    ) {
        updatedIngredients = tempIngredients.filter((ingredient, index) => {
            const firstIndex = tempIngredients.findIndex(
                (item) => item.name === ingredient.name
            )
            return firstIndex === index
        })
    }

    const updatedGroceryList = await prisma.groceryList.update({
        where: { id },
        data: {
            ...req.body,
            ingredients: updatedIngredients,
            updatedAt: undefined,
        },
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
    const id = parseInt(req.params.id)

    if (!id) {
        formatError(400, 'Id is required')
    }

    //check if req.userId has canEdit true in junction table = permission to add

    const canEdit = await prisma.userGroceryList.findFirst({
        where: {
            userId: req.userId,
            groceryListId: id,
            canEdit: true,
        },
    })

    if (!canEdit) {
        formatError(403, 'You are not authorized to share this grocery list')
    }

    const url = await encodeUrl({ groceryListId: id })

    if (url) {
        return res.status(200).send(url)
    }

    return formatError(500, 'Error creating copy link')
}

export const getShare = async (req, res) => {
    const groceryListId = parseInt(req.params.id)

    if (!groceryListId) {
        formatError(400, 'Valid grocery list id required')
    }

    const isOwner = await prisma.groceryList.findFirst({
        where: {
            id: groceryListId,
            ownerId: req.userId,
        },
    })

    if (!isOwner) {
        formatError(403, 'Unauthorized')
    }

    const userIds = await prisma.userGroceryList.findMany({
        where: {
            groceryListId,
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
                in: userIds.map((userGroceryList) => userGroceryList.userId),
            },
        },
        select: {
            id: true,
            name: true,
        },
    })

    const usersWithCanEdit = userIds.map((userGroceryList) => ({
        userId: userGroceryList.userId,
        canEdit: userGroceryList.canEdit,
        name: users.find((user) => user.id === userGroceryList.userId).name,
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

    const isOwner = await prisma.groceryList.findFirst({
        where: {
            id,
            ownerId: req.userId,
        },
    })

    const ownerName = await prisma.groceryList.findFirst({
        where: {
            id: req.userId,
        },
    })

    if (!isOwner) {
        formatError(403, 'Unauthorized')
    }

    if (editingIds.length > 0) {
        const userGroceryLists = await prisma.userGroceryList.findMany({
            where: {
                userId: { in: editingIds },
                groceryListId: id,
            },
        })

        const updated = await prisma.userGroceryList.updateMany({
            where: {
                userId: { in: editingIds },
                groceryListId: id,
            },
            data: {
                canEdit: !userGroceryLists[0].canEdit,
            },
        })
    }

    if (deletingIds.length > 0) {
        const deleted = await prisma.userGroceryList.deleteMany({
            where: {
                groceryListId: id,
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

    await prisma.userGroceryList.deleteMany({
        where: {
            groceryListId: id,
            userId: req.userId,
        },
    })

    return res.status(200).send('You have been removed')
}
