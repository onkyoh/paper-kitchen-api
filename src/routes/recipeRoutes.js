import express from 'express'

import {
    getRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    updateShare,
    makeShareUrl,
    getShare,
    removeShare,
} from '../controllers/recipeController.js'

const router = express.Router()

router.route('/').get(getRecipes).post(createRecipe)
router.route('/:id').put(updateRecipe).delete(deleteRecipe)
router
    .route('/:id/permissions')
    .get(getShare)
    .put(updateShare)
    .post(makeShareUrl)
    .delete(removeShare)

export default router
