import mongoose from 'mongoose'

const defaultOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
}

export const connectMongo = async (uri: string) => {
  if (!uri) {
    throw new Error('DATABASE_URL missing. Please set it in the environment.')
  }

  const cleanUri = uri.trim().replace(/\/$/, '')
  
  if (!cleanUri.startsWith('mongodb://') && !cleanUri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid DATABASE_URL format. Must start with mongodb:// or mongodb+srv://')
  }

  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected')
    return mongoose.connection
  }

  try {
    console.log('Attempting to connect to MongoDB...')
    await mongoose.connect(cleanUri, defaultOptions)
    console.log('✅ MongoDB connected successfully')
  } catch (error: any) {
    console.error('❌ MongoDB connection failed:', error.message)
    
    if (error.message.includes('whitelist') || error.message.includes('IP')) {
      console.error('\n⚠️  IP Whitelist Issue Detected!')
      console.error('Please add your current IP address to MongoDB Atlas IP Whitelist:')
      console.error('1. Go to https://cloud.mongodb.com/')
      console.error('2. Navigate to Network Access')
      console.error('3. Click "Add IP Address"')
      console.error('4. Add your current IP or use 0.0.0.0/0 for all IPs (development only)')
    }
    
    throw error
  }

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected')
  })

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error', error)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected')
  })

  process.on('SIGINT', async () => {
    await mongoose.connection.close()
    console.log('MongoDB connection closed due to app termination')
    process.exit(0)
  })

  return mongoose.connection
}

