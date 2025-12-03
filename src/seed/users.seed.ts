import 'dotenv/config'

import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

import { connectMongo } from '../lib/mongoose'

const databaseUrl = process.env.DATABASE_URL ?? ''

if (!databaseUrl) {
  console.error('DATABASE_URL missing in environment')
  process.exit(1)
}

const seeds = [
  {
    firstname: 'Gudworld',
    lastname: 'Admin',
    username: 'admin',
    email: 'admin@admin.in',
    mobile: '9999999999',
    role: 'Admin',
    status: 'Active',
    address: 'Corporate HQ, Waluj, Maharashtra',
    country: 'India',
    state: 'Maharashtra',
    city: 'Waluj',
    pincode: '431136',
    isDeleted: false,
    password: 'Admin@123',
  },
  {
    firstname: 'Sample',
    lastname: 'User',
    username: 'sampleuser',
    email: 'user@user.in',
    mobile: '8888888888',
    role: 'User',
    status: 'Active',
    address: 'Sample User Address, Waluj, Maharashtra',
    country: 'India',
    state: 'Maharashtra',
    city: 'Waluj',
    pincode: '431136',
    isDeleted: false,
    password: 'User@123',
  },
]

const seedUsers = async () => {
  await connectMongo(databaseUrl)
  const collection = mongoose.connection.collection('users')

  for (const seed of seeds) {
    const now = new Date()
    const { password, ...seedData } = seed
    const passwordHash = password ? await bcrypt.hash(password, 10) : null
    await collection.updateOne(
      { email: seed.email },
      {
        $set: {
          ...seedData,
          password: passwordHash,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          sessionToken: null,
        },
      },
      { upsert: true },
    )
    console.log(`Seeded user ${seed.email}`)
  }
}

seedUsers()
  .then(async () => {
    console.log('User seed completed successfully.')
    await mongoose.disconnect()
  })
  .catch(async (error) => {
    console.error('User seed failed:', error)
    await mongoose.disconnect()
    process.exit(1)
  })

