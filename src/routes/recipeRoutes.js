import express from 'express'

import {
    getRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    joinRecipe,
    updateShare,
    removeShare,
    makeShareUrl,
} from '../controllers/recipeController.js'

//auth middleware

const router = express.Router()

router.route('/').get(getRecipes).post(createRecipe)
router.route('/:id').put(updateRecipe).delete(deleteRecipe)
router
    .route('/:id/share')
    .put(updateShare)
    .delete(removeShare)
    .post(makeShareUrl)
router.route('/join/:url').post(joinRecipe)

export default router
