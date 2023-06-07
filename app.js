import 'express-async-errors'
import express from 'express'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import notFoundHandler from './middleware/notFoundHandler.js'
import errorHandler from './middleware/errorHandler.js'
import formatError from './util/formatError.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(helmet())
app.use(cookieParser())
app.use(express.json())

//connect db

//routes

app.use(notFoundHandler)
app.use(errorHandler)

export default app
