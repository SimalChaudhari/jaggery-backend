import mongoose, { Schema, Document } from 'mongoose'

export interface ICategory extends Document {
  title: string
  description: string
  image: string
  parentCategory: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    parentCategory: { type: Schema.Types.ObjectId, ref: 'categories', default: null },
  },
  {
    timestamps: true,
  },
)

export const CategoryModel = mongoose.model<ICategory>('categories', CategorySchema)

