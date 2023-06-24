import express from 'express'

import {
    registerUser,
    loginUser,
    getUser,
} from '../controllers/userController.js'

//auth middleware

const router = express.Router()

router.get('/', getUser)
router.post('/register', registerUser)
router.post('/login', loginUser)

export default router
