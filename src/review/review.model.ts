import mongoose, { Schema, Document } from 'mongoose'

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId
  rating: number
  review: string
  name: string
  email: string
  userId?: mongoose.Types.ObjectId // Optional: for logged-in users
  likes: string[] // Array of user identifiers (email or IP)
  dislikes: string[] // Array of user identifiers (email or IP)
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'products', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
    likes: { type: [String], default: [] },
    dislikes: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
)

export const ReviewModel = mongoose.model<IReview>('reviews', ReviewSchema)

