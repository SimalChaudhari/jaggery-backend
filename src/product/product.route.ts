import type { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { uploadProductMultiple } from '../middleware/upload.middleware'
import { ProductController } from './product.controller'

const productController = new ProductController()

export const attachProductRoutes = (router: Router) => {
  // Create new product (requires admin authentication)
  router.post(
    '/products',
    authenticateToken,
    requireAdmin,
    uploadProductMultiple,
    (req, res) => productController.create(req, res),
  )

  // Get all products (public - no authentication required)
  router.get('/products', (req, res) => productController.getAll(req, res))

  // Get product by ID (public - no authentication required)
  router.get('/products/:id', (req, res) => productController.getById(req, res))

  // Update product (requires admin authentication)
  router.put(
    '/products/:id',
    authenticateToken,
    requireAdmin,
    uploadProductMultiple,
    (req, res) => productController.update(req, res),
  )

  // Delete product (requires admin authentication)
  router.delete(
    '/products/:id',
    authenticateToken,
    requireAdmin,
    (req, res) => productController.delete(req, res),
  )

  // Product Image routes
  // Add image to product
  router.post(
    '/products/:productId/images',
    authenticateToken,
    requireAdmin,
    uploadProductMultiple,
    (req, res) => productController.addImage(req, res),
  )

  // Get all images for a product (public - no authentication required)
  router.get('/products/:productId/images', (req, res) => productController.getImages(req, res))

  // Delete a product image
  router.delete(
    '/products/images/:imageId',
    authenticateToken,
    requireAdmin,
    (req, res) => productController.deleteImage(req, res),
  )
}

