import { ReviewModel } from './review.model'

export interface CreateReviewDto {
  productId: string
  rating: number
  review: string
  name: string
  email: string
  userId?: string // Optional: for logged-in users
}

export interface UpdateReviewDto {
  rating?: number
  review?: string
  name?: string
}

export class ReviewService {
  async create(dto: CreateReviewDto) {
    const review = new ReviewModel({
      productId: dto.productId,
      rating: dto.rating,
      review: dto.review,
      name: dto.name,
      email: dto.email,
      userId: dto.userId || undefined,
    })

    await review.save()
    return review.toObject()
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await ReviewModel.findById(reviewId)
    if (!review) {
      throw new Error('Review not found')
    }

    // Check if user owns this review
    if (review.userId && review.userId.toString() !== userId) {
      throw new Error('You can only update your own review')
    }

    // Update fields
    if (dto.rating !== undefined) review.rating = dto.rating
    if (dto.review !== undefined) review.review = dto.review
    if (dto.name !== undefined) review.name = dto.name

    await review.save()
    return review.toObject()
  }

  async getByUserIdAndProductId(userId: string, productId: string) {
    const review = await ReviewModel.findOne({ userId, productId }).lean()
    return review
  }

  async getByProductId(productId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit
    
    const [reviews, totalCount] = await Promise.all([
      ReviewModel.find({ productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReviewModel.countDocuments({ productId }),
    ])
    
    return {
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    }
  }

  async getAll() {
    const reviews = await ReviewModel.find()
      .populate('productId', 'title')
      .sort({ createdAt: -1 })
      .lean()
    return reviews
  }

  async getById(id: string) {
    const review = await ReviewModel.findById(id).populate('productId', 'title').lean()
    if (!review) {
      throw new Error('Review not found')
    }
    return review
  }

  async likeReview(reviewId: string, userIdentifier: string) {
    const review = await ReviewModel.findById(reviewId)
    if (!review) {
      throw new Error('Review not found')
    }

    // Remove from dislikes if present
    review.dislikes = review.dislikes.filter((id) => id !== userIdentifier)
    
    // Add to likes if not already present
    if (!review.likes.includes(userIdentifier)) {
      review.likes.push(userIdentifier)
    }

    await review.save()
    return review.toObject()
  }

  async dislikeReview(reviewId: string, userIdentifier: string) {
    const review = await ReviewModel.findById(reviewId)
    if (!review) {
      throw new Error('Review not found')
    }

    // Remove from likes if present
    review.likes = review.likes.filter((id) => id !== userIdentifier)
    
    // Add to dislikes if not already present
    if (!review.dislikes.includes(userIdentifier)) {
      review.dislikes.push(userIdentifier)
    }

    await review.save()
    return review.toObject()
  }

  async removeLike(reviewId: string, userIdentifier: string) {
    const review = await ReviewModel.findById(reviewId)
    if (!review) {
      throw new Error('Review not found')
    }

    review.likes = review.likes.filter((id) => id !== userIdentifier)
    await review.save()
    return review.toObject()
  }

  async removeDislike(reviewId: string, userIdentifier: string) {
    const review = await ReviewModel.findById(reviewId)
    if (!review) {
      throw new Error('Review not found')
    }

    review.dislikes = review.dislikes.filter((id) => id !== userIdentifier)
    await review.save()
    return review.toObject()
  }

  async delete(id: string) {
    const review = await ReviewModel.findByIdAndDelete(id)
    if (!review) {
      throw new Error('Review not found')
    }
    return { message: 'Review deleted successfully' }
  }

  // Calculate rating statistics for a product
  async getProductRatingStats(productId: string) {
    const reviews = await ReviewModel.find({ productId }).lean()
    
    if (reviews.length === 0) {
      return {
        totalRatings: 0,
        totalReviews: 0,
        averageRating: 0,
        ratings: [
          { name: '5', starCount: 0, reviewCount: 0 },
          { name: '4', starCount: 0, reviewCount: 0 },
          { name: '3', starCount: 0, reviewCount: 0 },
          { name: '2', starCount: 0, reviewCount: 0 },
          { name: '1', starCount: 0, reviewCount: 0 },
        ],
      }
    }

    const totalReviews = reviews.length
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    const averageRating = Math.round(totalRatings * 10) / 10

    // Count reviews by rating
    const ratingCounts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((review) => {
      ratingCounts[review.rating as keyof typeof ratingCounts]++
    })

    const ratings = [
      { name: '5', starCount: ratingCounts[5], reviewCount: ratingCounts[5] },
      { name: '4', starCount: ratingCounts[4], reviewCount: ratingCounts[4] },
      { name: '3', starCount: ratingCounts[3], reviewCount: ratingCounts[3] },
      { name: '2', starCount: ratingCounts[2], reviewCount: ratingCounts[2] },
      { name: '1', starCount: ratingCounts[1], reviewCount: ratingCounts[1] },
    ]

    return {
      totalRatings: averageRating,
      totalReviews,
      averageRating,
      ratings,
    }
  }
}

