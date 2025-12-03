import 'dotenv/config'

import { createApp } from './app'
import { connectMongo } from './lib/mongoose'

const bootstrap = async () => {
  const port = Number(process.env.PORT ?? 3000)
  const databaseUrl = process.env.DATABASE_URL ?? ''
  const skipDbConnection = process.env.SKIP_DB_CONNECTION === 'true'

  if (!skipDbConnection) {
    try {
      await connectMongo(databaseUrl)
    } catch (error: any) {
      if (error.message.includes('whitelist') || error.message.includes('IP')) {
        console.error('MongoDB Atlas IP Whitelist Error: Add your IP at https://cloud.mongodb.com/ → Network Access')
      }
      throw error
    }
  } else {
    console.warn('Database connection skipped (SKIP_DB_CONNECTION=true)')
  }

  const app = createApp()

  app.listen(port, () => {
    console.log(`Express API running on http://localhost:${port}`)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap Express server', error)
  process.exit(1)
})

