import prisma from '../config/db.js'

import { genSalt, hash, compare } from 'bcrypt'

import formatError from '../util/formatError.js'
import generateToken from '../util/generateToken.js'
import decodeUrl from '../util/decodeUrl.js'
import encodeUrl from '../util/encodeUrl.js'

import {
    createUserSchema,
    emailSchema,
    loginUserSchema,
    passwordSchema,
} from '../validations/userValidation.js'

import {
    sendPasswordLink,
    sendAuthentication,
} from '../services/emailService.js'

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

    const emailTaken = await prisma.user.findFirst({
        where: {
            email: req.body.email,
            isAuthenticated: true,
        },
    })

    if (emailTaken) {
        formatError(409, 'Email in use')
    }

    const salt = await genSalt(10)
    const hashedPassword = await hash(req.body.password, salt)

    const newUser = await prisma.user.create({
        data: { ...req.body, password: hashedPassword },
    })

    if (newUser) {
        const token = generateToken(newUser.id)

        const url = await encodeUrl({
            userId: newUser.id,
        })

        if (!url) {
            formatError(500, 'Error creating url')
        }

        await sendAuthentication(url, req.body.email, newUser.username)

        return res.status(201).send({
            user: {
                id: newUser.id,
                username: newUser.username,
                name: newUser.name,
                email: {
                    address: newUser.email,
                    isAuthenticated: false,
                },
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
                email: {
                    address: user.email,
                    isAuthenticated: user.isAuthenticated,
                },
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
            email: {
                address: user.email,
                isAuthenticated: user.isAuthenticated,
            },
        })
    }
    formatError(404, 'User not found')
}

export const sendForgotPassword = async (req, res) => {
    const { error } = emailSchema.validate(req.body.email)

    if (error) {
        return formatError(400, error.details[0].message)
    }

    const user = await prisma.user.findFirst({
        where: {
            email: req.body.email,
            isAuthenticated: true,
        },
    })

    if (!user) {
        formatError(404, 'User with that authenticated email not found')
    }

    const url = await encodeUrl({
        userId: user.id,
    })

    if (!url) {
        formatError(500, 'Error creating url')
    }

    await sendPasswordLink(url, req.body.email)
    return res.status(200).send('Reset password email sent')
}

export const resetPassword = async (req, res) => {
    const { error } = passwordSchema.validate(req.body.password)

    if (error) {
        formatError(400, error.details[0].message)
    }

    const { url } = req.params

    let decodedUrl = await decodeUrl(url)

    const salt = await genSalt(10)
    const hashedPassword = await hash(req.body.password, salt)

    const user = await prisma.user.update({
        where: {
            id: decodedUrl.userId,
        },
        data: {
            password: hashedPassword,
        },
    })

    if (!user) {
        formatError(400, 'User not found')
    }

    const token = generateToken(user.id)

    return res.status(200).send({
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: {
                address: user.email,
                isAuthenticated: user.isAuthenticated,
            },
        },
        token,
    })
}

export const sendAuthenticationEmail = async (req, res) => {
    const { error } = emailSchema.validate(req.body.email)

    if (error) {
        return formatError(400, error.details[0].message)
    }

    const user = await prisma.user.update({
        where: {
            id: req.userId,
        },
        data: {
            email: req.body.email,
        },
    })

    if (!user) {
        formatError(404, 'User not found')
    }

    if (user.isAuthenticated) {
        return formatError(400, 'Account has an authenticated email')
    }

    const url = await encodeUrl({
        userId: req.userId,
    })

    if (!url) {
        formatError(500, 'Error creating url')
    }

    await sendAuthentication(url, req.body.email, user.username)
    return res.status(200).send('Authentication email sent')
}

export const authenticateEmail = async (req, res) => {
    const { url } = req.params

    let decodedUrl = await decodeUrl(url)

    const user = await prisma.user.update({
        where: {
            id: decodedUrl.userId,
        },
        data: {
            isAuthenticated: true,
        },
    })

    if (!user) {
        formatError(400, 'User not found')
    }

    const token = generateToken(user.id)

    return res.status(200).send({
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: {
                address: user.email,
                isAuthenticated: true,
            },
        },
        token,
    })
}
