import type { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { ReviewService } from './reviews.service'

const reviewService = new ReviewService()

export class ReviewController {
  async create(req: AuthRequest, res: Response) {
    try {
      const { productId, rating, review, name, email } = req.body

      if (!productId || !rating || !review || !name || !email) {
        return res.status(400).json({ message: 'All fields are required' })
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' })
      }

      // If user is logged in, use their userId
      const userId = req.user?.id || undefined

      const reviewData = await reviewService.create({
        productId,
        rating,
        review,
        name,
        email,
        userId,
      })

      return res.status(201).json({
        message: 'Review created successfully',
        data: reviewData,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to create review' })
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { rating, review, name } = req.body

      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      const reviewData = await reviewService.update(req.params.id, req.user.id, {
        rating,
        review,
        name,
      })

      return res.status(200).json({
        message: 'Review updated successfully',
        data: reviewData,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') || error.message.includes('own review') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to update review' })
    }
  }

  async getByUserAndProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      const review = await reviewService.getByUserIdAndProductId(req.user.id, req.params.productId)
      
      return res.status(200).json({
        data: review,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch review' })
    }
  }

  async getByProductId(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      
      const { reviews, pagination } = await reviewService.getByProductId(
        req.params.productId,
        page,
        limit
      )
      const stats = await reviewService.getProductRatingStats(req.params.productId)
      
      return res.status(200).json({
        data: {
          reviews,
          pagination,
          ...stats,
        },
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch reviews' })
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const reviews = await reviewService.getAll()
      return res.status(200).json({
        length: reviews.length,
        data: reviews,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch reviews' })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const review = await reviewService.getById(req.params.id)
      return res.status(200).json({
        data: review,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to fetch review' })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await reviewService.delete(req.params.id)
      return res.status(200).json(result)
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to delete review' })
    }
  }

  async like(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      // Use userId from authenticated user
      const userId = req.user.id

      const review = await reviewService.likeReview(req.params.id, userId)
      return res.status(200).json({
        message: 'Review liked successfully',
        data: review,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to like review' })
    }
  }

  async dislike(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      // Use userId from authenticated user
      const userId = req.user.id

      const review = await reviewService.dislikeReview(req.params.id, userId)
      return res.status(200).json({
        message: 'Review disliked successfully',
        data: review,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to dislike review' })
    }
  }

  async removeLike(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      // Use userId from authenticated user
      const userId = req.user.id

      const review = await reviewService.removeLike(req.params.id, userId)
      return res.status(200).json({
        message: 'Like removed successfully',
        data: review,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to remove like' })
    }
  }

  async removeDislike(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      // Use userId from authenticated user
      const userId = req.user.id

      const review = await reviewService.removeDislike(req.params.id, userId)
      return res.status(200).json({
        message: 'Dislike removed successfully',
        data: review,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to remove dislike' })
    }
  }
}

