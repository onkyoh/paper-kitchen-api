import express from 'express'

import {
    createGroceryList,
    getGroceryLists,
    updateGroceryList,
    deleteGroceryList,
    joinGroceryList,
    updateShare,
    removeShare,
    makeShareUrl,
} from '../controllers/groceryController.js'

const router = express.Router()

router.route('/').get(getGroceryLists).post(createGroceryList)
router.route('/:id').put(updateGroceryList).delete(deleteGroceryList)
router
    .route('/:id/share')
    .put(updateShare)
    .delete(removeShare)
    .get(makeShareUrl)
router.route('/join/:url').post(joinGroceryList)

export default router
