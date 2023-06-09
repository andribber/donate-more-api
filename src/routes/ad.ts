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
      cityCode: currentAd.cityCode,
      street: currentAd.street,
      addressNumber: currentAd.addressNumber,
      neightborhood: currentAd.neightborhood,
      city: currentAd.city,
      phoneNumber: currentAd.phoneNumber,
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

    const ad = await prisma.ad.findUniqueOrThrow({
      where: { id },
    })

    return {
      id: ad.id,
      author: ad.userId,
      category: ad.categoryId,
      title: ad.title,
      description: ad.description,
      cityCode: ad.cityCode,
      street: ad.street,
      addressNumber: ad.addressNumber,
      neightborhood: ad.neightborhood,
      city: ad.city,
      phoneNumber: ad.phoneNumber,
      itemQuantity: ad.itemQuantity,
      createdAt: format(ad.createdAt, 'dd/MM/yyyy HH:mm:ss'),
      //TODO - Imagens
    }
  })

  app.post('/ads', async (request, reply) => {
    const rules = z.object({
      title: z.string(),
      description: z.string(),
      categoryId: z.string(),
      authorId: z.string(),
      itemQuantity: z.number(),
      cityCode: z.string(),
      street: z.string(),
      addressNumber: z.string(),
      neightborhood: z.string(),
      city: z.string(),
      phoneNumber: z.string(),
      //TODO imageIds: z.array(imageRules),
    })

    const { 
      title, 
      description, 
      cityCode,
      street,
      addressNumber,
      neightborhood,
      city,
      phoneNumber, 
      itemQuantity, 
      categoryId, 
      authorId 
    } = rules.parse(request.body)

    const findCategory = await prisma.category.findUniqueOrThrow({
      where: {
        id: categoryId,
      },
    })

    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        cityCode,
        street,
        addressNumber,
        neightborhood,
        city,
        phoneNumber,
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

    reply.code(204).send()
  })
}
