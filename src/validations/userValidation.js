import Joi from 'joi'

const createUserSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    name: Joi.string().min(1).max(40).required(),
    password: Joi.string().min(6).max(30).required(),
})

const loginUserSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().required(),
})

export { createUserSchema, loginUserSchema }
