import type { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { SizeController } from './size.controller'

const sizeController = new SizeController()

export const attachSizeRoutes = (router: Router) => {
  // Create new size (requires admin authentication)
  router.post('/sizes', authenticateToken, requireAdmin, (req, res) => sizeController.create(req, res))

  // Get all sizes (public endpoint)
  router.get('/sizes', (req, res) => sizeController.getAll(req, res))

  // Get size by ID (public endpoint)
  router.get('/sizes/:id', (req, res) => sizeController.getById(req, res))

  // Update size (requires admin authentication)
  router.put('/sizes/:id', authenticateToken, requireAdmin, (req, res) => sizeController.update(req, res))

  // Delete size (requires admin authentication)
  router.delete('/sizes/:id', authenticateToken, requireAdmin, (req, res) => sizeController.delete(req, res))
}

