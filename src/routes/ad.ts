import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { Ad } from '@prisma/client'
import format from 'date-fns/format'

export async function adRoutes(app: FastifyInstance) {
  //   app.addHook('preHandler', async (request) => {
  //     await request.jwtVerify()
  //   })

  app.get('/ads', async (request, reply) => {
    const ads = await prisma.ad.findMany({
      where: {
        enabled: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return ads.map((currentAd: Ad) => ({
      id: currentAd.id,
      author: currentAd.userId,
      category: currentAd.categoryId,
      title: currentAd.title,
      description: currentAd.description,
      location: currentAd.location,
      itemQuantity: currentAd.itemQuantity,
      createdAt: format(currentAd.createdAt, 'dd/MM/yyyy HH:mm:ss'),
      //TODO - Imagens
    }))
  })

  app.get('/ads/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const ad = await prisma.ad
      .findUniqueOrThrow({
        where: { id },
      })
      .catch((err) => {
        return reply.status(204).send()
      })

    return ad
  })

  app.post('/ads', async (request, reply) => {
    const rules = z.object({
      title: z.string(),
      description: z.string(),
      categoryId: z.string(),
      authorId: z.string(),
      itemQuantity: z.number(),
      location: z.string(),
      //TODO imageIds: z.array(imageRules),
    })

    const { title, description, location, itemQuantity, categoryId, authorId } =
      rules.parse(request.body)

    const findCategory = await prisma.category.findUniqueOrThrow({
      where: {
        id: categoryId,
      },
    })

    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        location,
        itemQuantity: itemQuantity,
        categoryId: categoryId,
        userId: authorId,
      },
    })
  })

  app.delete('/ads/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const ad = await prisma.ad.findUniqueOrThrow({
      where: { id },
    })

    if (ad.userId !== request.user.sub) {
      return reply.status(401).send()
    }

    await prisma.ad.update({ where: { id }, data: { enabled: false } })
  })
}
