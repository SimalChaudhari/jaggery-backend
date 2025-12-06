import type { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { AddressController } from './address.controller'

const addressController = new AddressController()

export const attachAddressRoutes = (router: Router) => {
  // Create new address (requires authentication)
  router.post('/addresses', authenticateToken, (req, res) => addressController.create(req as any, res))

  // Get all addresses for authenticated user (requires authentication)
  router.get('/addresses', authenticateToken, (req, res) => addressController.getAllByUser(req as any, res))

  // Get default address for authenticated user (requires authentication)
  router.get('/addresses/default', authenticateToken, (req, res) => addressController.getDefault(req as any, res))

  // Get address by ID (requires authentication)
  router.get('/addresses/:id', authenticateToken, (req, res) => addressController.getById(req as any, res))

  // Update address (requires authentication)
  router.put('/addresses/:id', authenticateToken, (req, res) => addressController.update(req as any, res))

  // Set address as default (requires authentication)
  router.patch('/addresses/:id/default', authenticateToken, (req, res) => addressController.setDefault(req as any, res))

  // Delete address (requires authentication)
  router.delete('/addresses/:id', authenticateToken, (req, res) => addressController.delete(req as any, res))
}

