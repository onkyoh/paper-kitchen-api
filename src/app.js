import 'express-async-errors'
import express from 'express'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cors from 'cors'
import notFoundHandler from './middleware/notFoundHandler.js'
import errorHandler from './middleware/errorHandler.js'
import protect from './middleware/protect.js'
import formatError from './util/formatError.js'
import userRouter from './routes/userRoutes.js'
import recipeRouter from './routes/recipeRoutes.js'
import groceryRouter from './routes/groceryRoutes.js'
import joinRouter from './routes/joinRoutes.js'

dotenv.config()
const app = express()

//config middleware
app.use(
    cors({
        origin: process.env.ORIGIN || 'paperkitchen.ca',
        credentials: true,
    })
)
app.use(helmet())
app.use(express.json())
//routes
app.use('/api/users', userRouter)
app.use('/api/recipes', protect, recipeRouter)
app.use('/api/grocery-lists', protect, groceryRouter)
app.use('/api/join', joinRouter)
//middlware
app.use(notFoundHandler)
app.use(errorHandler)

export default app
