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
import joinRouter from './routes/joinRoutes.js'

dotenv.config()

const app = express()

app.use(
    cors({
        origin: ['http://127.0.0.1:5173', 'https://paperkitchen.ca'],
        credentials: true,
    })
)
app.use(helmet())
app.use(cookieParser())
app.use(express.json())
//routes

console.log(process.env.DATABASE_URL)

app.use('/api/users', userRouter)
app.use('/api/recipes', protect, recipeRouter)
app.use('/api/grocery-lists', protect, groceryRouter)
app.use('/api/join', joinRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
