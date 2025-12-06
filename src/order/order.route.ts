import type { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { OrderController } from './order.controller'
import { PaymentController } from './payment.controller'
import express from 'express'

const orderController = new OrderController()
const paymentController = new PaymentController()

export const attachOrderRoutes = (router: Router) => {
  // Order routes
  router.post('/orders', authenticateToken, (req, res) => orderController.create(req as any, res))
  router.get('/orders', authenticateToken, (req, res) => orderController.getAll(req as any, res))
  router.get('/orders/:id', authenticateToken, (req, res) => orderController.getById(req as any, res))
  router.put('/orders/:id', authenticateToken, (req, res) => orderController.update(req as any, res))
  router.delete('/orders/:id', authenticateToken, (req, res) => orderController.delete(req as any, res))

  // Payment routes
  router.post(
    '/payments/create-payment-intent',
    authenticateToken,
    (req, res) => paymentController.createPaymentIntent(req as any, res),
  )
  router.post(
    '/payments/confirm-payment',
    authenticateToken,
    (req, res) => paymentController.confirmPayment(req as any, res),
  )

  // Webhook route (no authentication, uses Stripe signature verification)
  router.post(
    '/payments/webhook',
    express.raw({ type: 'application/json' }),
    (req, res) => paymentController.handleWebhook(req, res),
  )
}

