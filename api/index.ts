import 'dotenv/config'

import mongoose from 'mongoose'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createApp } from '../src/app'
import { connectMongo } from '../src/lib/mongoose'

let app: any = null

const getApp = async () => {
  if (app) {
    return app
  }

  const databaseUrl = process.env.DATABASE_URL ?? ''
  const skipDbConnection = process.env.SKIP_DB_CONNECTION === 'true'

  // Connect to MongoDB if not already connected
  // Mongoose connection is cached globally, so this is efficient for serverless
  if (!skipDbConnection && databaseUrl && mongoose.connection.readyState !== 1) {
    try {
      await connectMongo(databaseUrl)
    } catch (error: any) {
      console.error('MongoDB connection error:', error.message)
      // Continue without DB connection for health checks
      if (error.message.includes('whitelist') || error.message.includes('IP')) {
        console.error('MongoDB Atlas IP Whitelist Error: Add Vercel IPs at https://cloud.mongodb.com/ → Network Access')
      }
    }
  }

  app = createApp()
  return app
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getApp()
  // Express app handles the request and response internally
  expressApp(req, res)
}

