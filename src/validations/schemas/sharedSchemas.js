import Joi from 'joi'
import { BACKGROUND_COLORS } from '../../util/constants.js'

export const instructionSchema = Joi.object({
    id: Joi.string().required(),
    text: Joi.string().required(),
})

export const ingredientSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    amount: Joi.string().allow(null).empty(''),
    unit: Joi.string().allow(null).empty(''),
})

export const updateShareSchema = Joi.object({
    id: Joi.number().integer().required(),
    editingIds: Joi.array().items(Joi.number()).min(0).required().messages({
        any: 'There was an error selecting users to update',
    }),
    deletingIds: Joi.array().items(Joi.number()).min(0).required().messages({
        any: 'There was an error selecting users to remove',
    }),
})

export const removeShareSchema = Joi.object({
    id: Joi.number().integer().required(),
    userId: Joi.number().integer().required(),
})

export const makeShareUrlSchema = Joi.object({
    id: Joi.number().integer().required(),
    title: Joi.string().required(),
    owner: Joi.string().required(),
})

export const createListSchema = Joi.object({
    title: Joi.string().required(),
    color: Joi.string()
        .valid(...BACKGROUND_COLORS)
        .required()
        .messages({
            any: 'A valid color was not selected',
        }),
})
