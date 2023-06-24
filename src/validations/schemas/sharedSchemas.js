import Joi from 'joi'
import { BACKGROUND_COLORS } from '../../util/constants.js'

export const instructionSchema = Joi.object({
    id: Joi.string().required(),
    text: Joi.string().required(),
})

export const ingredientSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    amount: Joi.string().allow(null),
    unit: Joi.string().allow(null),
})

export const updateShareSchema = Joi.object({
    id: Joi.number().integer().required(),
    userId: Joi.number().integer().required(),
    canEdit: Joi.boolean().required(),
})

export const removeShareSchema = Joi.object({
    id: Joi.number().integer().required(),
    userId: Joi.number().integer().required(),
})

export const shareUrlSchema = Joi.object({
    title: Joi.string().required(),
    canEdit: Joi.boolean().required(),
    id: Joi.number().integer().required(),
})

export const createListSchema = Joi.object({
    title: Joi.string().required(),
    color: Joi.string()
        .valid(...BACKGROUND_COLORS)
        .required(),
})
