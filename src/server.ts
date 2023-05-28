import 'dotenv/config'

import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import fastify from 'fastify'
import { authRoutes } from './routes/auth'
import { categoryRoutes } from './routes/category'
import { adRoutes } from './routes/ad'
import { imgRoutes } from './routes/image'
import multer from 'fastify-multer'

const app = fastify()

app.register(cors, {
  origin: true,
})

app.register(jwt, {
  secret: 'api-donate-more',
})
app.register(multer.contentParser)
app.register(authRoutes)
app.register(categoryRoutes)
app.register(adRoutes)
app.register(imgRoutes)

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('🚀 HTTP server running on http://localhost:3333')
  })
