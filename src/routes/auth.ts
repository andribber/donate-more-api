import { FastifyInstance } from 'fastify'
import axios from 'axios'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function authRoutes(app: FastifyInstance) {
  app.get('/auth/callback', async function (request, reply) {
    try {
      const result =
        await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)

      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: 'Bearer ' + result.token.access_token,
          },
        }
      )

      const userSchema = z.object({
        id: z.string(),
        name: z.string(),
        given_name: z.string(),
        family_name: z.string(),
        picture: z.string().url(),
        locale: z.string(),
        email: z.string(),
      })

      const userInfo = userSchema.parse(response.data)

      let user = await prisma.user.findUnique({
        where: {
          google_id: userInfo.id,
        },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: uuidv4(),
            google_id: userInfo.id,
            first_name: userInfo.given_name,
            last_name: userInfo.family_name,
            email: userInfo.email,
            picture_url: userInfo.picture,
            phone_number: '1234567', //TODO ajustar para ser solicitado em um front e guardado no banco
          },
        })
      }

      const token = app.jwt.sign(
        {
          name: user.first_name,
          gid: user.google_id,
        },
        {
          sub: user.id,
          expiresIn: '30 days',
        }
      )

      reply.send(token)
    } catch (err) {
      reply.send(err)
    }
  })
}
