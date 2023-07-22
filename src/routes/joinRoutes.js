import express from 'express'
import protect from '../middleware/protect.js'

import { join, getJoinInfo } from '../controllers/joinController.js'

const router = express.Router()

router.route('/:url').post(protect, join).get(getJoinInfo)

export default router
