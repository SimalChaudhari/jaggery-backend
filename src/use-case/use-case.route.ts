import type { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { uploadUseCaseSingle } from '../middleware/upload.middleware'
import { UseCaseController } from './use-case.controller'

const useCaseController = new UseCaseController()

export const attachUseCaseRoutes = (router: Router) => {
  // Create new use case (requires admin authentication)
  router.post('/use-cases', authenticateToken, requireAdmin, uploadUseCaseSingle, (req, res) => useCaseController.create(req, res))

  // Get all use cases (public - no authentication required)
  router.get('/use-cases', (req, res) => useCaseController.getAll(req, res))

  // Get use case by ID (public - no authentication required)
  router.get('/use-cases/:id', (req, res) => useCaseController.getById(req, res))

  // Update use case (requires admin authentication)
  router.put('/use-cases/:id', authenticateToken, requireAdmin, uploadUseCaseSingle, (req, res) => useCaseController.update(req, res))

  // Delete use case (requires admin authentication)
  router.delete('/use-cases/:id', authenticateToken, requireAdmin, (req, res) => useCaseController.delete(req, res))
}

