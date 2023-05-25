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
  city_code: z.string().optional(),     
  street: z.string().optional(),        
  address_number: z.string().optional(),
  neightborhood: z.string().optional(), 
  city: z.string().optional(),          
  phone_number: z.string().optional(), 
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
    const { 
      title,
      description,
      city_code,
      street,
      address_number,
      neightborhood,
      city,
      phone_number,
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
        id: uuidv4(),
        title,
        description,
        city_code,
        street,
        address_number,
        neightborhood,
        city,
        phone_number,
        category_id: categoryId,
        user_id: authorId,
      },
    })
  })

  app.put('/ads/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const bodySchema = z.object({ 
      title: z.string().optional(),               
      description: z.string().optional(),
      category_id: z.string().optional(),           
      city_code: z.string().optional(),     
      street: z.string().optional(),        
      address_number: z.string().optional(),
      neightborhood: z.string().optional(), 
      city: z.string().optional(),          
      phone_number: z.string().optional(),  
    })

    const {
      title,
      description,
      category_id,
      city_code,
      street,
      address_number,
      neightborhood,
      city,
      phone_number,
    } = bodySchema.parse(request.body)

    let ad = await prisma.ad.findUniqueOrThrow({
      where: {
        id,
      },
    })

    ad = await prisma.ad.update({
      where: {
        id,
      },
      data: {
        title: title || undefined,
        description: description || undefined,
        city_code: city_code || undefined,
        street: street || undefined,
        address_number: address_number || undefined,
        neightborhood: neightborhood || undefined,
        city: city || undefined,
        category_id: category_id || undefined,
        phone_number: phone_number || undefined,
      },
    })

    return ad
  })

  app.delete('/ads/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const ad = await prisma.ad.delete({
      where: {
        id,
      },
    })

    reply.code(204).send()
  })
}
