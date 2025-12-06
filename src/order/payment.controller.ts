import { Request, Response } from 'express'
import Stripe from 'stripe'
import { OrdersService } from './orders.service'
import { PaymentStatus, OrderStatus } from './order.model'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export class PaymentController {
  private stripe: Stripe
  private ordersService: OrdersService

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
    })
    this.ordersService = new OrdersService()
  }

  /**
   * Create payment intent for an order
   * POST /api/payments/create-payment-intent
   */
  createPaymentIntent = async (req: AuthRequest, res: Response) => {
    try {
      const { orderId, amount, currency = 'inr' } = req.body

      if (!orderId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Order ID and amount are required',
        })
      }

      // Verify order exists and belongs to user
      const order = await this.ordersService.getById(orderId, req.user?.id)
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        })
      }

      // Check if order is already paid
      if (order.paymentStatus === PaymentStatus.Paid) {
        return res.status(400).json({
          success: false,
          message: 'Order is already paid',
        })
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents/paisa
        currency: currency.toLowerCase(),
        receipt_email: req.user?.email || undefined, // Add customer email
        metadata: {
          orderId: orderId.toString(),
          userId: req.user?.id || '',
          userEmail: req.user?.email || '',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      // Update order with payment intent ID
      await this.ordersService.update(orderId, {
        paymentIntentId: paymentIntent.id,
      })

      res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    } catch (error: any) {
      console.error('Error creating payment intent:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create payment intent',
      })
    }
  }

  /**
   * Confirm payment after successful Stripe payment
   * POST /api/payments/confirm-payment
   */
  confirmPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { paymentIntentId } = req.body

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment intent ID is required',
        })
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          success: false,
          message: `Payment not succeeded. Status: ${paymentIntent.status}`,
        })
      }

      // Find order by payment intent ID
      const order = await this.ordersService.getByPaymentIntentId(paymentIntentId)
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found for this payment intent',
        })
      }

      // Verify order belongs to user (if not admin)
      // Handle both populated and non-populated user field
      const orderUserId = order.user
        ? typeof order.user === 'string'
          ? order.user
          : (order.user as any)._id
            ? (order.user as any)._id.toString()
            : order.user.toString()
        : null
      const requestUserId = req.user?.id?.toString()

      if (req.user?.role !== 'Admin' && orderUserId !== requestUserId) {
        console.error('Authorization failed:', {
          orderUserId,
          requestUserId,
          userRole: req.user?.role,
          orderUser: order.user,
          reqUser: req.user,
        })
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to confirm this payment',
        })
      }

      // Update order payment status
      const orderId = (order._id as any).toString()
      const updatedOrder = await this.ordersService.update(orderId, {
        paymentStatus: PaymentStatus.Paid,
        orderStatus: OrderStatus.Processing,
      })

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        order: updatedOrder,
      })
    } catch (error: any) {
      console.error('Error confirming payment:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to confirm payment',
      })
    }
  }

  /**
   * Handle Stripe webhook events
   * POST /api/payments/webhook
   */
  handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature']
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set')
      return res.status(400).send('Webhook secret not configured')
    }

    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          const order = await this.ordersService.getByPaymentIntentId(paymentIntent.id)

          if (order) {
            const orderId = (order._id as any).toString()
            await this.ordersService.update(orderId, {
              paymentStatus: PaymentStatus.Paid,
              orderStatus: OrderStatus.Processing,
            })
            console.log(`Order ${order.orderNumber} payment confirmed via webhook`)
          }
        }
        break

      case 'payment_intent.payment_failed':
        {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          const order = await this.ordersService.getByPaymentIntentId(paymentIntent.id)

          if (order) {
            const orderId = (order._id as any).toString()
            await this.ordersService.update(orderId, {
              paymentStatus: PaymentStatus.Failed,
            })
            console.log(`Order ${order.orderNumber} payment failed via webhook`)
          }
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  }
}

