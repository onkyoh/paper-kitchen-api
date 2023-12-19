import Joi from 'joi'

const usernameSchema = Joi.string().alphanum().min(3).max(30).required()
const nameSchema = Joi.string().min(1).max(40).required()
const passwordSchema = Joi.string().min(6).max(30).required()
const emailSchema = Joi.string().email().required()

const loginUserSchema = Joi.object({
    username: usernameSchema,
    password: passwordSchema,
})

const createUserSchema = Joi.object({
    username: usernameSchema,
    name: nameSchema,
    password: passwordSchema,
    email: emailSchema,
})

export { createUserSchema, loginUserSchema, emailSchema, passwordSchema }
