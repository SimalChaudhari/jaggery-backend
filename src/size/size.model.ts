import mongoose, { Schema, Document } from 'mongoose'

export interface ISize extends Document {
  title: string
  createdAt: Date
  updatedAt: Date
}

const SizeSchema = new Schema<ISize>(
  {
    title: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
  },
)

export const SizeModel = mongoose.model<ISize>('sizes', SizeSchema)

