import Joi from 'joi'
import { BACKGROUND_COLORS } from '../util/constants.js'
import { instructionSchema, ingredientSchema } from './schemas/sharedSchemas.js'

export const updateRecipeSchema = Joi.object({
    id: Joi.number().integer().required(),
    ownerId: Joi.number().integer().required(),
    title: Joi.string().required(),
    serves: Joi.number().integer().allow(null).max(30),
    cookingTime: Joi.number().integer().allow(null).max(600),
    cost: Joi.number().integer().allow(null).max(300),
    favourite: Joi.boolean().required(),
    color: Joi.string()
        .valid(...BACKGROUND_COLORS)
        .required()
        .messages({
            'any.only': 'A valid color was not selected',
        }),
    type: Joi.string().valid('recipe').required(),
    ingredientsQuery: Joi.array().items(Joi.string()),
    createdAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required(),
    instructions: Joi.array().items(instructionSchema).required(),
    ingredients: Joi.array().items(ingredientSchema).required(),
})

export const recipesQuerySchema = Joi.object({
    isOwner: Joi.boolean(),
    serves: Joi.number().integer().allow('').max(30),
    maxCookingTime: Joi.number().integer().allow('').max(600),
    maxCost: Joi.number().integer().allow('').max(300),
    favourite: Joi.boolean(),
    ingredients: Joi.array().items(Joi.string()),
    page: Joi.number().integer(),
    pageSize: Joi.number().integer(),
})
