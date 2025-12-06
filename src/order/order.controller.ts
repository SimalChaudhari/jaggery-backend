import { Request, Response } from 'express'
import { OrdersService, CreateOrderDto, UpdateOrderDto } from './orders.service'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export class OrderController {
  private ordersService: OrdersService

  constructor() {
    this.ordersService = new OrdersService()
  }

  /**
   * Create a new order
   * POST /api/orders
   */
  create = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
      }

      const orderData: CreateOrderDto = req.body

      // Validate required fields
      if (
        !orderData.items ||
        !Array.isArray(orderData.items) ||
        orderData.items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Order items are required',
        })
      }

      if (!orderData.shippingAddress) {
        return res.status(400).json({
          success: false,
          message: 'Shipping address is required',
        })
      }

      if (!orderData.total || orderData.total <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Total amount must be greater than 0',
        })
      }

      const order = await this.ordersService.create(req.user.id, orderData)

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order,
      })
    } catch (error: any) {
      console.error('Error creating order:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create order',
      })
    }
  }

  /**
   * Get all orders
   * GET /api/orders
   */
  getAll = async (req: AuthRequest, res: Response) => {
    try {
      // Admin can see all orders, users can only see their own
      const userId = req.user?.role === 'Admin' ? undefined : req.user?.id

      const orders = await this.ordersService.getAll(userId)

      res.status(200).json({
        success: true,
        count: orders.length,
        orders,
      })
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch orders',
      })
    }
  }

  /**
   * Get order by ID
   * GET /api/orders/:id
   */
  getById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      // Admin can see any order, users can only see their own
      const userId = req.user?.role === 'Admin' ? undefined : req.user?.id

      const order = await this.ordersService.getById(id, userId)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        })
      }

      res.status(200).json({
        success: true,
        order,
      })
    } catch (error: any) {
      console.error('Error fetching order:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch order',
      })
    }
  }

  /**
   * Update order
   * PUT /api/orders/:id
   */
  update = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const updateData: UpdateOrderDto = req.body

      // Only admin can update orders
      if (req.user?.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can update orders',
        })
      }

      const order = await this.ordersService.update(id, updateData)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        })
      }

      res.status(200).json({
        success: true,
        message: 'Order updated successfully',
        order,
      })
    } catch (error: any) {
      console.error('Error updating order:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update order',
      })
    }
  }

  /**
   * Delete order
   * DELETE /api/orders/:id
   */
  delete = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      // Only admin can delete orders
      if (req.user?.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete orders',
        })
      }

      const deleted = await this.ordersService.delete(id)

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        })
      }

      res.status(200).json({
        success: true,
        message: 'Order deleted successfully',
      })
    } catch (error: any) {
      console.error('Error deleting order:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete order',
      })
    }
  }
}

