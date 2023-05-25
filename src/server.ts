import 'dotenv/config'
import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth'
import { categoryRoutes } from './routes/category'
import { adRoutes } from './routes/ad'

const app = fastify()

app.register(cors, {
  origin: true,
})

app.register(jwt, {
  secret: 'api-donate-more',
})

app.register(authRoutes)
app.register(categoryRoutes)
app.register(adRoutes)

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('🚀 HTTP server running on http://localhost:3333')
  })
