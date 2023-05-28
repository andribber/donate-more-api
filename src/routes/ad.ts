import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { Ad } from '@prisma/client'
import format from 'date-fns/format'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import multer from 'fastify-multer'

const upload = multer()

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

    for (let ad of ads) {
      const images = await prisma.image.findMany({
        where: { adId: ad.id },
        orderBy: {
          positionOrder: 'asc',
        },
      })
      if (images.length > 0) {
        ad.images = images.map((image) => ({
          pathUrl: image.pathUrl,
          positionOrder: image.positionOrder,
        }))
      }
    }

    return ads.map((currentAd: Ad) => ({
      id: currentAd.id,
      author: currentAd.userId,
      category: currentAd.categoryId,
      title: currentAd.title,
      description: currentAd.description,
      location: currentAd.location,
      itemQuantity: currentAd.itemQuantity,
      createdAt: format(currentAd.createdAt, 'dd/MM/yyyy HH:mm:ss'),
      images: currentAd.images,
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

    const images = await prisma.image.findMany({
      where: { adId: ad.id },
      orderBy: {
        positionOrder: 'asc',
      },
    })

    return {
      id: ad.id,
      author: ad.userId,
      category: ad.categoryId,
      title: ad.title,
      description: ad.description,
      location: ad.location,
      itemQuantity: ad.itemQuantity,
      createdAt: format(ad.createdAt, 'dd/MM/yyyy HH:mm:ss'),
      images: images,
    }
  })

  app.post(
    '/ads',
    { preHandler: upload.array('photos', 6) },
    async (request, reply) => {
      const rules = z.object({
        title: z.string(),
        description: z.string(),
        categoryId: z.string(),
        authorId: z.string(),
        itemQuantity: z.number(),
        location: z.string(),
      })

      const files = request.files //is array of `photos` files
      const body: any = request.body //will contain the text fields

      const {
        title,
        description,
        location,
        itemQuantity,
        categoryId,
        authorId,
      } = rules.parse(JSON.parse(body['obj']))

      await prisma.category.findUniqueOrThrow({
        where: {
          id: categoryId,
        },
      })

      const ad = await prisma.ad.create({
        data: {
          title,
          description,
          location,
          itemQuantity,
          categoryId,
          userId: authorId,
        },
      })

      if (files.length > 0) {
        const imagesData = generateImageData(files)
        imagesData.forEach(async (image: any) => {
          saveImageOnServer(image.buffer, image.pathUrl)

          await prisma.image.create({
            data: {
              pathUrl: image.pathUrl,
              positionOrder: image.positionOrder,
              adId: ad.id,
            },
          })
        })
      }

      reply.send()
    }
  )

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

  function generateImageData(files: any) {
    let position = 0

    const result = files.map((element: any, index: number) => {
      return {
        buffer: element.buffer,
        pathUrl: `./uploads/${uuidv4()}.${element['mimetype'].split('/')[1]}`,
        positionOrder: position++,
      }
    })
    return result
  }

  function saveImageOnServer(buffer: any, destinationPath: string) {
    return new Promise((resolve, reject) => {
      fs.writeFile(destinationPath, buffer, (error) => {})
    })
  }
}
