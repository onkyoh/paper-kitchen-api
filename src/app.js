import 'express-async-errors'
import express from 'express'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import notFoundHandler from './middleware/notFoundHandler.js'
import errorHandler from './middleware/errorHandler.js'
import protect from './middleware/protect.js'
import formatError from './util/formatError.js'
import userRouter from './routes/userRoutes.js'
import recipeRouter from './routes/recipeRoutes.js'
import groceryRouter from './routes/groceryRoutes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(helmet())
app.use(cookieParser())
app.use(express.json())
//routes

app.use('/api/users', userRouter)
app.use('/api/recipes', protect, recipeRouter)
app.use('/api/grocery-lists', protect, groceryRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
