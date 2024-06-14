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

import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../swagger.json' with { type: 'json' }

dotenv.config()
const app = express()

//config middleware
app.use(
    cors({
        origin: process.env.ORIGIN || 'https://paperkitchen.ca',
        credentials: true,
    })
)
app.use(helmet())
app.use(express.json())

//routes
const apiRouter = express.Router()
apiRouter.use('/users', userRouter)
apiRouter.use('/recipes', protect, recipeRouter)
apiRouter.use('/grocery-lists', protect, groceryRouter)
apiRouter.use('/join', joinRouter)
apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use('/api', apiRouter)

//middlware
app.use(notFoundHandler)
app.use(errorHandler)

export default app
