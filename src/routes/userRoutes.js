import express from 'express'

import {
    registerUser,
    loginUser,
    getUser,
    sendForgotPassword,
    resetPassword,
    sendAuthenticationEmail,
    authenticateEmail,
} from '../controllers/userController.js'

import protect from '../middleware/protect.js'

const router = express.Router()

router.get('/', protect, getUser)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/forgot-password', sendForgotPassword)
router.patch('/reset-password/:url', resetPassword)
router.post('/add-email', protect, sendAuthenticationEmail)
router.patch('/authenticate-email/:url', authenticateEmail)

export default router
