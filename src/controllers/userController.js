import formatError from '../util/formatError.js'
import {
    createUserSchema,
    loginUserSchema,
} from '../validations/userValidation.js'
import prisma from '../config/db.js'
import { genSalt, hash, compare } from 'bcrypt'
import generateToken from '../util/generateToken.js'

export const registerUser = async (req, res) => {
    const { error } = createUserSchema.validate(req.body)

    if (error) {
        formatError(400, error.details[0].message)
    }

    const userExists = await prisma.user.findUnique({
        where: {
            username: req.body.username,
        },
    })

    if (userExists) {
        formatError(409, 'Username taken')
    }

    const salt = await genSalt(10)
    const hashedPassword = await hash(req.body.password, salt)

    const newUser = await prisma.user.create({
        data: { ...req.body, password: hashedPassword },
    })

    if (newUser) {
        const token = generateToken(newUser.id)

        return res.status(201).send({
            user: {
                id: newUser.id,
                username: newUser.username,
                name: newUser.name,
            },
            token,
        })
    }
    formatError(500, 'Error creating user')
}

export const loginUser = async (req, res) => {
    const { error } = loginUserSchema.validate(req.body)

    if (error) {
        formatError(400, error.details[0].message)
    }

    const user = await prisma.user.findUnique({
        where: {
            username: req.body.username,
        },
    })

    if (!user) {
        formatError(400, 'invalid credentials')
    }

    if (user && (await compare(req.body.password, user.password))) {
        const token = generateToken(user.id)

        return res.status(201).send({
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
            },
            token,
        })
    }
    formatError(401, 'invalid credentials')
}

export const getUser = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: {
            id: req.userId,
        },
    })
    if (user) {
        return res.status(200).send({
            id: user.id,
            username: user.username,
            name: user.name,
        })
    }
    formatError(500, 'User not found')
}
