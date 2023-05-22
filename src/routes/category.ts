import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function categoryRoutes(app: FastifyInstance) {
  // app.addHook('preHandler', async (request) => {
  //   await request.jwtVerify()
  // })

  app.get('/categories', async (request) => {
    const categories = await prisma.category.findMany({
      where: {
        enabled: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return categories.map((category) => {
      return {
        id: category.id,
        name: category.name,
        description: category.description,
      }
    })
  })

  app.get('/categories/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const category = await prisma.category.findUniqueOrThrow({
      where: {
        id,
      },
    })

    return reply.code(200).send(category)
  })

  app.post('/categories', async (request) => {
    const bodySchema = z.object({
      name: z.string(),
      description: z.string(),
    })

    const { name, description } = bodySchema.parse(request.body)

    const category = await prisma.category.create({
      data: {
        id: uuidv4(),
        name,
        description,
      },
    })

    return category
  })

  app.put('/categories/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const bodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
    })

    const { name, description } = bodySchema.parse(request.body)

    let category = await prisma.category.findUniqueOrThrow({
      where: {
        id,
      },
    })

    category = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name: name || undefined,
        description: description || undefined,
      },
    })

    return category
  })

  app.delete('/categories/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const category = await prisma.category.findUniqueOrThrow({
      where: {
        id,
      },
    })

    await prisma.category.update({
      where: {
        id,
      },
      data: {
        enabled: false,
      },
    })

    reply.code(204).send()
  })
}
