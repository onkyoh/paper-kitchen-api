import Joi from 'joi'
import { BACKGROUND_COLORS } from '../util/constants.js'
import { instructionSchema, ingredientSchema } from './schemas/sharedSchemas.js'

export const updateRecipeSchema = Joi.object({
    id: Joi.number().integer().required(),
    ownerId: Joi.number().integer().required(),
    title: Joi.string().required(),
    serves: Joi.number().integer().allow(null),
    cookingTime: Joi.number().integer().allow(null),
    cost: Joi.number().integer().allow(null),
    favourite: Joi.boolean().required(),
    color: Joi.string()
        .valid(...BACKGROUND_COLORS)
        .required(),
    type: Joi.string().valid('recipe').required(),
    ingredientsQuery: Joi.array().items(Joi.string()),
    createdAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required(),
    instructions: Joi.array().items(instructionSchema).required(),
    ingredients: Joi.array().items(ingredientSchema).required(),
})

export const recipesQuerySchema = Joi.object({
    isOwner: Joi.boolean(),
    maxCookingTime: Joi.string(),
    maxCost: Joi.string(),
    serves: Joi.string(),
    favourite: Joi.boolean(),
    ingredients: Joi.array().items(Joi.string()),
    page: Joi.number().integer(),
    pageSize: Joi.number().integer(),
})
