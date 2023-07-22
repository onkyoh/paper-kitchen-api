import express from 'express'

import {
    createGroceryList,
    getGroceryLists,
    updateGroceryList,
    deleteGroceryList,
    updateShare,
    getShare,
    makeShareUrl,
    removeShare,
} from '../controllers/groceryController.js'

const router = express.Router()

router.route('/').get(getGroceryLists).post(createGroceryList)
router.route('/:id').put(updateGroceryList).delete(deleteGroceryList)
router
    .route('/:id/permissions')
    .get(getShare)
    .put(updateShare)
    .post(makeShareUrl)
    .delete(removeShare)

export default router
