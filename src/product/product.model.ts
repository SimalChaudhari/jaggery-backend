import mongoose, { Schema, Document } from 'mongoose'

export interface ISizePrice {
  sizeId: mongoose.Types.ObjectId
  actualPrice: number
  discountPrice?: number
}

export interface IProduct extends Document {
  title: string
  description: string
  benefits?: string
  ingredients?: string
  storageConditions?: string
  actualPrice: number
  discountPrice?: number
  isSale: boolean
  inStock: boolean
  categories: mongoose.Types.ObjectId[]
  useCases: mongoose.Types.ObjectId[]
  sizes: mongoose.Types.ObjectId[]
  sizePrices?: ISizePrice[]
  createdAt: Date
  updatedAt: Date
}

const SizePriceSchema = new Schema<ISizePrice>(
  {
    sizeId: { type: Schema.Types.ObjectId, ref: 'sizes', required: true },
    actualPrice: { type: Number, required: true },
    discountPrice: { type: Number },
  },
  { _id: false }
)

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    benefits: { type: String },
    ingredients: { type: String },
    storageConditions: { type: String },
    actualPrice: { type: Number, required: true },
    discountPrice: { type: Number },
    isSale: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    categories: [{ type: Schema.Types.ObjectId, ref: 'categories', required: true }],
    useCases: [{ type: Schema.Types.ObjectId, ref: 'usecases' }],
    sizes: [{ type: Schema.Types.ObjectId, ref: 'sizes' }],
    sizePrices: [SizePriceSchema],
  },
  {
    timestamps: true,
  },
)

export const ProductModel = mongoose.model<IProduct>('products', ProductSchema)

