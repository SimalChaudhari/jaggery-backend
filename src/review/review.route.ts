import type { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { optionalAuthenticateToken } from '../middleware/optional-auth.middleware'
import { requireAdmin } from '../middleware/admin.middleware'
import { ReviewController } from './review.controller'

const reviewController = new ReviewController()

export const attachReviewRoutes = (router: Router) => {
  // Create new review (public - but can include userId if authenticated)
  router.post('/products/:productId/reviews', optionalAuthenticateToken, (req, res) => {
    // Add productId from params to body
    req.body.productId = req.params.productId
    reviewController.create(req, res)
  })

  // Update review (requires authentication - user can only update their own review)
  router.put('/reviews/:id', authenticateToken, (req, res) => reviewController.update(req, res))

  // Get user's review for a product (requires authentication)
  router.get('/products/:productId/reviews/my-review', authenticateToken, (req, res) => reviewController.getByUserAndProduct(req, res))

  // Get all reviews for a product (public - no authentication required)
  router.get('/products/:productId/reviews', (req, res) => reviewController.getByProductId(req, res))

  // Get all reviews (requires admin authentication)
  router.get('/reviews', authenticateToken, requireAdmin, (req, res) => reviewController.getAll(req, res))

  // Get review by ID (requires admin authentication)
  router.get('/reviews/:id', authenticateToken, requireAdmin, (req, res) => reviewController.getById(req, res))

  // Delete review (requires admin authentication)
  router.delete('/reviews/:id', authenticateToken, requireAdmin, (req, res) => reviewController.delete(req, res))

  // Like/Dislike review (requires authentication)
  router.post('/reviews/:id/like', authenticateToken, (req, res) => reviewController.like(req, res))
  router.post('/reviews/:id/dislike', authenticateToken, (req, res) => reviewController.dislike(req, res))
  router.post('/reviews/:id/remove-like', authenticateToken, (req, res) => reviewController.removeLike(req, res))
  router.post('/reviews/:id/remove-dislike', authenticateToken, (req, res) => reviewController.removeDislike(req, res))
}

