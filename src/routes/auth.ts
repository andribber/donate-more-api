import 'dotenv/config'
import { FastifyInstance } from 'fastify'
import axios from 'axios'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { v4 as uuidv4 } from 'uuid'

//https://accounts.google.com/o/oauth2/v2/auth?response_type=code&scope=openid%20profile%20email&client_id=927884961647-hbuhl6781r59lcorsb9jn12u7jpjgr8f.apps.googleusercontent.com&redirect_uri=http://localhost:3333/auth/callback

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  given_name: z.string(),
  family_name: z.string(),
  picture: z.string().url(),
  locale: z.string(),
  email: z.string(),
})

const bodySchema = z.object({
  code: z.string(),
})

export async function authRoutes(app: FastifyInstance) {
  app.get('/auth', async (request, reply) => {
    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&scope=openid%20profile%20email&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}`

    reply.redirect(redirectUrl)
  })

  app.post('/register', async (request: any, reply) => {
    const { code } = bodySchema.parse(request.body)

    const accessTokenResponse = await axios
      .post(process.env.GOOGLE_TOKEN_URI!, {
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code',
      })
      .then((response) => {
        axios
          .get(process.env.GOOGLE_USER_INFO_URI!, {
            headers: {
              Authorization: `Bearer ${response.data.access_token}`,
            },
          })
          .then(async (res) => {
            const userInfo = userSchema.parse(res.data)

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

            return { token }
          })
          .catch((err) => {
            return reply.send(err)
          })
      })
      .catch((err) => {
        return reply.send(err)
      })
  })
}
