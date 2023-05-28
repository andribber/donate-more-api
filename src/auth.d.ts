import '@fastify/jwt'
import { FastifyRequest } from 'fastify'

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    user: {
      sub: string
      name: string
      avatarUrl: string
    }
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    files?: any
  }
}
