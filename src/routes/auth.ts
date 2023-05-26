import 'dotenv/config'
import { FastifyInstance } from 'fastify'
import axios from 'axios'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

//https://accounts.google.com/o/oauth2/v2/auth?response_type=code&scope=openid%20profile%20email&client_id=927884961647-hbuhl6781r59lcorsb9jn12u7jpjgr8f.apps.googleusercontent.com&redirect_uri=http://localhost:3333/auth/callback

export async function authRoutes(app: FastifyInstance) {
  // app.get('/auth', async (request, reply) => {
  //   const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&scope=openid%20profile%20email&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}`

  //   reply.redirect(redirectUrl)
  // })

  app.post('/register', async (request, reply) => {
    const bodySchema = z.object({
      code: z.string(),
    })

    const { code } = bodySchema.parse(request.body)

    const accessTokenResponse = await axios.post(
      'https://accounts.google.com/o/oauth2/token', {
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: 'authorization_code',
    })

    const userInfoResponse = await axios
      .get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${accessTokenResponse.data.access_token}`,
        },
      })

    const userSchema = z.object({
      id: z.string(),
      name: z.string(),
      given_name: z.string(),
      family_name: z.string(),
      picture: z.string().url(),
      email: z.string(),
    })

    const userInfo = userSchema.parse(userInfoResponse.data)

    let user = await prisma.user.findUnique({
      where: {
        googleId: userInfo.id,
      },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: userInfo.id,
          name: userInfo.given_name.concat(' ').concat(userInfo.family_name),
          email: userInfo.email,
          avatarUrl: userInfo.picture,
        },
      })
    }

    const token = app.jwt.sign(
      {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: '30 days',
      }
    )

    return { token }
  })
}
