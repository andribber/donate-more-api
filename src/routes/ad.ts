import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { prisma } from '../lib/prisma'
import { Ad } from '@prisma/client'
import format from 'date-fns/format'
import { v4 as uuidv4 } from 'uuid'

const rules = z.object({
  title: z.string(),
  description: z.string(),
  categoryId: z.string(),
  authorId: z.string(),
  itemQuantity: z.number(),
  location: z.string(),
  //TODO imageIds: z.array(imageRules),
})

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
        created_at: 'desc',
      },
    })

    return ads.map((currentAd: Ad) => ({
      id: currentAd.id,
      author: currentAd.user_id,
      category: currentAd.category_id,
      title: currentAd.title,
      description: currentAd.description,
      location: currentAd.location,
      itemQuantity: currentAd.item_quantity,
      createdAt: format(currentAd.created_at, 'dd/MM/yyyy HH:mm:ss'),
      //TODO - Imagens
    }))
  })

  app.post('/ads', async (request, reply) => {
    const { title, description, location, itemQuantity, categoryId, authorId } =
      rules.parse(request.body)

    const findCategory = await prisma.category.findUniqueOrThrow({
      where: {
        id: categoryId,
      },
    })

    const ad = await prisma.ad.create({
      data: {
        id: uuidv4(),
        title,
        description,
        location,
        item_quantity: itemQuantity,
        category_id: categoryId,
        user_id: authorId,
      },
    })
  })
}
