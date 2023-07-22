import express from 'express'

import {
    registerUser,
    loginUser,
    getUser,
    logoutUser,
} from '../controllers/userController.js'

import protect from '../middleware/protect.js'

const router = express.Router()

router.get('/', protect, getUser)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)

export default router
