import { OrderModel, IOrder, OrderStatus, PaymentStatus, PaymentMethod } from './order.model'
import mongoose from 'mongoose'

export interface CreateOrderDto {
  items: Array<{
    product: string | mongoose.Types.ObjectId
    quantity: number
    price: number
    name: string
    image?: string
  }>
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    country: string
    pincode: string
    mobile: string
  }
  paymentMethod: PaymentMethod
  subtotal: number
  shipping: number
  discount: number
  total: number
}

export interface UpdateOrderDto {
  orderStatus?: OrderStatus
  paymentStatus?: PaymentStatus
  paymentIntentId?: string
}

export class OrdersService {
  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `ORD-${timestamp}-${random}`
  }

  /**
   * Create a new order
   */
  async create(userId: string, orderData: CreateOrderDto): Promise<IOrder> {
    let orderNumber = ''
    let isUnique = false

    // Ensure unique order number
    while (!isUnique) {
      orderNumber = this.generateOrderNumber()
      const existing = await OrderModel.findOne({ orderNumber })
      if (!existing) {
        isUnique = true
      }
    }

    const order = new OrderModel({
      user: userId,
      orderNumber,
      items: orderData.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image,
      })),
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: PaymentStatus.Pending,
      orderStatus: OrderStatus.Pending,
      subtotal: orderData.subtotal,
      shipping: orderData.shipping,
      discount: orderData.discount,
      total: orderData.total,
    })

    return await order.save()
  }

  /**
   * Get all orders (with optional user filter)
   */
  async getAll(userId?: string): Promise<IOrder[]> {
    const query = userId ? { user: userId } : {}
    return await OrderModel.find(query)
      .populate('user', 'username email firstname lastname')
      .populate('items.product', 'title image')
      .sort({ createdAt: -1 })
      .exec()
  }

  /**
   * Get order by ID
   */
  async getById(orderId: string, userId?: string): Promise<IOrder | null> {
    const query: any = { _id: orderId }
    if (userId) {
      query.user = userId
    }

    return await OrderModel.findOne(query)
      .populate('user', 'username email firstname lastname mobile')
      .populate('items.product', 'title image actualPrice discountPrice')
      .exec()
  }

  /**
   * Get order by order number
   */
  async getByOrderNumber(orderNumber: string, userId?: string): Promise<IOrder | null> {
    const query: any = { orderNumber }
    if (userId) {
      query.user = userId
    }

    return await OrderModel.findOne(query)
      .populate('user', 'username email firstname lastname mobile')
      .populate('items.product', 'title image actualPrice discountPrice')
      .exec()
  }

  /**
   * Get order by payment intent ID
   */
  async getByPaymentIntentId(paymentIntentId: string): Promise<IOrder | null> {
    return await OrderModel.findOne({ paymentIntentId })
      .populate('user', 'username email firstname lastname mobile')
      .populate('items.product', 'title image actualPrice discountPrice')
      .exec()
  }

  /**
   * Update order
   */
  async update(orderId: string, updateData: UpdateOrderDto, userId?: string): Promise<IOrder | null> {
    const query: any = { _id: orderId }
    if (userId) {
      query.user = userId
    }

    return await OrderModel.findOneAndUpdate(query, updateData, { new: true })
      .populate('user', 'username email firstname lastname mobile')
      .populate('items.product', 'title image actualPrice discountPrice')
      .exec()
  }

  /**
   * Delete order
   */
  async delete(orderId: string, userId?: string): Promise<boolean> {
    const query: any = { _id: orderId }
    if (userId) {
      query.user = userId
    }

    const result = await OrderModel.findOneAndDelete(query).exec()
    return !!result
  }
}

