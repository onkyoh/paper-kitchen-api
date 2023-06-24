import Joi from 'joi'
import { BACKGROUND_COLORS } from '../util/constants.js'
import { instructionSchema, ingredientSchema } from './schemas/sharedSchemas.js'

export const updateGrocerySchema = Joi.object({
    id: Joi.number().integer().required(),
    ownerId: Joi.number().integer().required(),
    title: Joi.string().required(),
    color: Joi.string()
        .valid(...BACKGROUND_COLORS)
        .required(),
    type: Joi.string().valid('grocery').required(),
    createdAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required(),
    ingredients: Joi.array().items(ingredientSchema).required(),
})

export const groceryQuerySchema = Joi.object({
    page: Joi.number().integer(),
    pageSize: Joi.number().integer(),
})
