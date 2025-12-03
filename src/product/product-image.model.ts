import mongoose, { Schema, Document } from 'mongoose'

export interface IProductImage extends Document {
  productId: mongoose.Types.ObjectId
  image: string // File path or URL
  createdAt: Date
  updatedAt: Date
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'products', required: true },
    image: { type: String, required: true },
  },
  {
    timestamps: true,
  },
)

export const ProductImageModel = mongoose.model<IProductImage>('productimages', ProductImageSchema)

