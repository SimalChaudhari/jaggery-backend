import type { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { uploadSingle } from '../middleware/upload.middleware'
import { CategoryController } from './category.controller'

const categoryController = new CategoryController()

export const attachCategoryRoutes = (router: Router) => {
  // Create new category (requires admin authentication)
  router.post(
    '/categories',
    authenticateToken,
    requireAdmin,
    uploadSingle,
    (req, res) => categoryController.create(req, res),
  )

  // Get all categories (public - no authentication required)
  router.get('/categories', (req, res) => categoryController.getAll(req, res))

  // Get category by ID (public - no authentication required)
  router.get('/categories/:id', (req, res) => categoryController.getById(req, res))

  // Update category (requires admin authentication)
  router.put(
    '/categories/:id',
    authenticateToken,
    requireAdmin,
    uploadSingle,
    (req, res) => categoryController.update(req, res),
  )

  // Delete category (requires admin authentication)
  router.delete(
    '/categories/:id',
    authenticateToken,
    requireAdmin,
    (req, res) => categoryController.delete(req, res),
  )
}

