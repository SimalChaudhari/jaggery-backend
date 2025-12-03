import express, { Express, Router } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { attachAuthRoutes } from './auth/auth.route'
import { attachUserRoutes } from './user/user.route'
import { attachCategoryRoutes } from './category/category.route'
import { attachProductRoutes } from './product/product.route'
import { attachUseCaseRoutes } from './use-case/use-case.route'
import { attachSizeRoutes } from './size/size.route'
import { attachReviewRoutes } from './review/review.route'
import { attachCloudinaryRoutes } from './cloudinary/cloudinary.route'

export const createApp = (): Express => {
  const app = express()

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'http://localhost:3000', 'http://localhost:3030', 'data:', 'blob:', 'https://res.cloudinary.com'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )
  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(
    morgan('dev', {
      skip: () => process.env.NODE_ENV === 'test',
    }),
  )

  // Root route
  app.get('/', (_req, res) => {
    res.status(200).json({ 
      message: 'Jaggery Backend API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api',
        ping: '/api/ping'
      }
    })
  })

  // Health check route (no /api prefix)
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  // Create API router with /api prefix
  const apiRouter = Router()
  attachAuthRoutes(apiRouter)
  attachUserRoutes(apiRouter)
  attachCategoryRoutes(apiRouter)
  attachProductRoutes(apiRouter)
  attachUseCaseRoutes(apiRouter)
  attachSizeRoutes(apiRouter)
  attachReviewRoutes(apiRouter)
  attachCloudinaryRoutes(apiRouter)

  // Ping route
  apiRouter.get('/ping', (_req, res) => {
    res.status(200).json({ ok: true, message: 'Server live with Mongo connection pending...' })
  })

  // API root route
  apiRouter.get('/', (_req, res) => {
    res.status(200).json({ 
      message: 'Jaggery API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        products: '/api/products',
        categories: '/api/categories',
        useCases: '/api/use-cases',
        sizes: '/api/sizes',
        reviews: '/api/reviews',
        cloudinary: '/api/cloudinary'
      }
    })
  })

  // Mount API router at /api prefix
  app.use('/api', apiRouter)

  return app
}

