import mongoose, { Schema, Document } from 'mongoose'

export enum OrderStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
}

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Failed = 'Failed',
  Refunded = 'Refunded',
}

export enum PaymentMethod {
  Stripe = 'stripe',
  Cash = 'cash',
  Other = 'other',
}

export interface IOrderItem {
  product: mongoose.Types.ObjectId
  quantity: number
  price: number
  name: string
  image?: string
}

export interface IShippingAddress {
  name: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  mobile: string
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId
  orderNumber: string
  items: IOrderItem[]
  shippingAddress: IShippingAddress
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentIntentId?: string
  orderStatus: OrderStatus
  subtotal: number
  shipping: number
  discount: number
  total: number
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'products', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    name: { type: String, required: true },
    image: { type: String },
  },
  { _id: false },
)

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true },
    mobile: { type: String, required: true },
  },
  { _id: false },
)

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Pending,
    },
    paymentIntentId: { type: String },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Pending,
    },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: true,
  },
)

// Indexes for faster queries
OrderSchema.index({ user: 1 })
// orderNumber index is automatically created by unique: true
OrderSchema.index({ paymentIntentId: 1 })
OrderSchema.index({ createdAt: -1 })

export const OrderModel = mongoose.model<IOrder>('orders', OrderSchema)

