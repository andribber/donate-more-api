/* eslint-disable prettier/prettier */
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { prisma } from '../lib/prisma'

export async function adRoutes(app: FastifyInstance) {
    app.addHook('preHandler', async (request) => {
        await request.jwtVerify()
    });

    app.get('/ads', async (request) => {
        const ads = await prisma.ads.findMany({
            where: {
                user_id: request.user.sub
            },
            orderBy: {
                created_at: 'desc',
            },
        })

        return ads.map((ad: {
            id: number;
            title: string;
            description: string;
            category: string;
            created_at: string;
            images: object;
        }) => {
            return {
                id: ad.id,
                title: ad.title,
                description: ad.description,
                category: ad.category,
                created_at: ad.created_at,
                images: ad.images,
            }
        })
    });

    app.post('/ads', async (request) => {
        // rules to images, the image already has to exist on database
        const imageRules = z.object({
            id: z.number(),
        });

        const rules = z.object({
            title: z.string(),
            description: z.string(),
            categoryId: z.number(),
            imageIds: z.array(imageRules),
        });

        const { title, description, categoryId, imageIds } = rules.parse(request.body);

        const category = await prisma.categories.findUniqueOrThrow({
            where: {
                id: categoryId,
            },
        });

        const images = imageIds.map((id) => {
            return prisma.categories.findMany({
                where: {
                    id
                },
            })
        });

        const ad = await prisma.ads.create({
            data: {
                title,
                description,
                category_id: category.id,
                user_id: request.user.sub,
                images: images.map((image) => image.id),
            }
        });

        return ad;
    });
}