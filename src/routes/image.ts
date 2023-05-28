import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { Ad } from '@prisma/client'
import fs from 'fs'
import util from 'util'
import { pipeline } from 'stream'
import { v4 as uuidv4 } from 'uuid'

const pump = util.promisify(pipeline)

export async function imgRoutes(app: FastifyInstance) {
  //   app.addHook('preHandler', async (request) => {
  //     await request.jwtVerify()
  //   })

  app.post('/images', async (request, reply) => {
    const parts = request.files()
    let count = 0

    for await (const part of parts) {
      if (count > 5 || !part.mimetype.startsWith('image/')) {
        return reply
          .status(400)
          .send({ Error: 'Invalid file type or quantity is greater than 5' })
      }

      const exension = part.mimetype.split('/')[1]
      const filename = `./uploads/${uuidv4()}.${exension}`
      await pump(part.file, fs.createWriteStream(filename))
    }
    return { message: 'files uploaded' }
  })

  // app.get('/images', async (request, reply) => {
  //   const ads = await prisma.ad.findMany({
  //     where: {
  //       enabled: true,
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //   })

  //   return ads.map((currentAd: Ad) => ({
  //     id: currentAd.id,
  //     author: currentAd.userId,
  //     category: currentAd.categoryId,
  //     title: currentAd.title,
  //     description: currentAd.description,
  //     location: currentAd.location,
  //     itemQuantity: currentAd.itemQuantity,
  //     createdAt: format(currentAd.createdAt, 'dd/MM/yyyy HH:mm:ss'),
  //     //TODO - Imagens
  //   }))
  // })
}
