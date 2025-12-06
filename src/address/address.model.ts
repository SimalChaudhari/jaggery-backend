import mongoose, { Schema, Document } from 'mongoose'

export interface IAddress extends Document {
  user: mongoose.Types.ObjectId
  address: string
  city: string
  state: string
  country: string
  pincode: string
  label?: string // Optional: "Home", "Work", "Office", etc.
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const AddressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true },
    label: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
AddressSchema.index({ user: 1 })

export const AddressModel = mongoose.model<IAddress>('addresses', AddressSchema)

