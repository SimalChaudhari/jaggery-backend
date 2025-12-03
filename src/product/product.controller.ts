import type { Request, Response } from 'express'
import { ProductService } from './products.service'
import cloudinary from '../lib/cloudinary'

const productService = new ProductService()

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Convert buffer to data URI format for Cloudinary
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    
    cloudinary.uploader.upload(
      dataUri,
      {
        folder: 'product', // Upload to product folder
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          // Store the public_id in database (e.g., "product/filename")
          resolve(result.public_id)
        } else {
          reject(new Error('Upload failed: No result returned'))
        }
      },
    )
  })
}

// Helper function to delete image from Cloudinary
async function deleteFromCloudinary(imageValue: string): Promise<void> {
  try {
    if (!imageValue) return

    let imagePublicId = imageValue

    // If it's a full Cloudinary URL, extract public_id
    if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
      const urlParts = imageValue.split('/')
      const uploadIndex = urlParts.findIndex((part) => part === 'upload')
      if (uploadIndex !== -1 && urlParts[uploadIndex + 1]) {
        // Skip version if present (e.g., v1764673992)
        const versionIndex = uploadIndex + 1
        const publicIdIndex = urlParts[versionIndex].startsWith('v') ? versionIndex + 1 : versionIndex
        imagePublicId = urlParts.slice(publicIdIndex).join('/').replace(/\.[^/.]+$/, '') // Remove extension
      }
    } else {
      // If it's just a filename (old format), try to find it in product folder
      // Check if it already has folder prefix
      if (!imagePublicId.startsWith('product/')) {
        // Try with product folder prefix
        const filenameWithoutExt = imagePublicId.replace(/\.[^/.]+$/, '')
        // Replace spaces with underscores (Cloudinary format)
        const transformedName = filenameWithoutExt.replace(/\s+/g, '_')
        imagePublicId = `product/${transformedName}`
      } else {
        // Already has folder, just remove extension
        imagePublicId = imagePublicId.replace(/\.[^/.]+$/, '')
      }
    }

    console.log('Deleting from Cloudinary:', imagePublicId)
    const result = await cloudinary.uploader.destroy(imagePublicId)
    console.log('Cloudinary delete result:', result)
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error)
    // Don't throw error, just log it - product deletion should continue even if image delete fails
  }
}

export class ProductController {
  async create(req: Request, res: Response) {
    try {
      const { title, description, benefits, ingredients, storageConditions, actualPrice, discountPrice, isSale, inStock, categories, useCases, sizes, sizePrices } = req.body

      // Validate required fields
      if (!title || !description || actualPrice === undefined) {
        return res.status(400).json({ message: 'Title, description, and actualPrice are required' })
      }

      // Parse categories (should be array of category IDs)
      let categoryArray: string[] = []
      if (categories) {
        categoryArray = Array.isArray(categories) ? categories : JSON.parse(categories)
      }

      if (!categoryArray || categoryArray.length === 0) {
        return res.status(400).json({ message: 'At least one category is required' })
      }

      // Parse use cases (optional array of use case IDs)
      let useCaseArray: string[] = []
      if (useCases) {
        useCaseArray = Array.isArray(useCases) ? useCases : JSON.parse(useCases)
      }

      // Parse sizes (optional array of size IDs)
      let sizeArray: string[] = []
      if (sizes) {
        sizeArray = Array.isArray(sizes) ? sizes : JSON.parse(sizes)
      }

      // Parse size prices (optional array of size price objects)
      let sizePriceArray: any[] = []
      if (sizePrices) {
        sizePriceArray = Array.isArray(sizePrices) ? sizePrices : JSON.parse(sizePrices)
      }

      // If sizes are selected, use size-specific prices; otherwise use normal prices
      let finalActualPrice = parseFloat(actualPrice)
      let finalDiscountPrice = discountPrice ? parseFloat(discountPrice) : undefined
      let finalSizePrices: any[] = []

      if (sizeArray.length > 0 && sizePriceArray.length > 0) {
        // Sizes selected - use size-specific prices
        finalSizePrices = sizePriceArray
        // Keep actualPrice as base price, but sizePrices will be used for display
      } else {
        // No sizes selected - use normal prices
        finalSizePrices = []
      }

      // Create product
      const product = await productService.create({
        title,
        description,
        benefits: benefits || '',
        ingredients: ingredients || '',
        storageConditions: storageConditions || '',
        actualPrice: finalActualPrice,
        discountPrice: finalDiscountPrice,
        isSale: isSale === 'true' || isSale === true,
        inStock: inStock === 'true' || inStock === true,
        categories: categoryArray,
        useCases: useCaseArray,
        sizes: sizeArray,
        sizePrices: finalSizePrices,
      })

      // Handle multiple images if uploaded
      const files = req.files as Express.Multer.File[]
      const productId = (product as any)._id?.toString() || (product as any).id
      if (files && files.length > 0) {
        const imagePromises = files.map(async (file) => {
          try {
            // Upload to Cloudinary and get public_id
            const publicId = await uploadToCloudinary(file)
            return productService.addImage(productId, publicId)
          } catch (uploadError: any) {
            console.error('Cloudinary upload error:', uploadError)
            throw new Error(`Failed to upload image to Cloudinary: ${uploadError.message}`)
          }
        })
        await Promise.all(imagePromises)
      }

      // Fetch product with images
      const productWithImages = await productService.getById(productId)
      const images = await productService.getImagesByProductId(productId)

      return res.status(201).json({
        message: 'Product created successfully',
        data: {
          ...productWithImages,
          images,
        },
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to create product' })
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const products = await productService.getAll()

      // Import ReviewService
      const { ReviewService } = await import('../review/reviews.service')
      const reviewService = new ReviewService()

      // Fetch images and review stats for each product
      const productsWithImages = await Promise.all(
        products.map(async (product) => {
          const productId = (product as any)._id?.toString() || (product as any).id
          const images = await productService.getImagesByProductId(productId)
          
          // Fetch review statistics for this product
          const stats = await reviewService.getProductRatingStats(productId)
          
          return {
            ...product,
            images,
            totalRatings: stats.totalRatings || 0,
            totalReviews: stats.totalReviews || 0,
          }
        }),
      )

      return res.status(200).json({
        length: productsWithImages.length,
        data: productsWithImages,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch products' })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const product = await productService.getById(req.params.id)
      const images = await productService.getImagesByProductId(req.params.id)
      
      // Fetch reviews and rating stats for this product
      const { ReviewService } = await import('../review/reviews.service')
      const reviewService = new ReviewService()
      const reviews = await reviewService.getByProductId(req.params.id)
      const stats = await reviewService.getProductRatingStats(req.params.id)

      return res.status(200).json({
        data: {
          ...product,
          images,
          reviews: reviews || [],
          ratings: stats.ratings || [],
          totalRatings: stats.totalRatings || 0,
          totalReviews: stats.totalReviews || 0,
        },
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to fetch product' })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { title, description, benefits, ingredients, storageConditions, actualPrice, discountPrice, isSale, inStock, categories, useCases, sizes, sizePrices } = req.body

      const updateData: any = {}
      if (title) updateData.title = title
      if (description) updateData.description = description
      if (benefits !== undefined) updateData.benefits = benefits || ''
      if (ingredients !== undefined) updateData.ingredients = ingredients || ''
      if (storageConditions !== undefined) updateData.storageConditions = storageConditions || ''
      if (actualPrice !== undefined) updateData.actualPrice = parseFloat(actualPrice)
      if (discountPrice !== undefined) updateData.discountPrice = discountPrice ? parseFloat(discountPrice) : undefined
      if (isSale !== undefined) updateData.isSale = isSale === 'true' || isSale === true
      if (inStock !== undefined) updateData.inStock = inStock === 'true' || inStock === true
      if (categories) {
        updateData.categories = Array.isArray(categories) ? categories : JSON.parse(categories)
      }
      if (useCases !== undefined) {
        updateData.useCases = Array.isArray(useCases) ? useCases : JSON.parse(useCases)
      }
      if (sizes !== undefined) {
        updateData.sizes = Array.isArray(sizes) ? sizes : JSON.parse(sizes)
      }
      
      // Handle size prices logic
      if (sizePrices !== undefined) {
        const parsedSizePrices = Array.isArray(sizePrices) ? sizePrices : JSON.parse(sizePrices)
        const parsedSizes = updateData.sizes || (sizes ? (Array.isArray(sizes) ? sizes : JSON.parse(sizes)) : [])
        
        if (parsedSizes.length > 0 && parsedSizePrices.length > 0) {
          // Sizes selected - use size-specific prices
          updateData.sizePrices = parsedSizePrices
        } else {
          // No sizes selected - clear sizePrices
          updateData.sizePrices = []
        }
      } else if (updateData.sizes && updateData.sizes.length === 0) {
        // If sizes array is being cleared, also clear sizePrices
        updateData.sizePrices = []
      }

      const product = await productService.update(req.params.id, updateData)

      // Handle new images if uploaded
      const files = req.files as Express.Multer.File[]
      if (files && files.length > 0) {
        const imagePromises = files.map(async (file) => {
          try {
            // Upload to Cloudinary and get public_id
            const publicId = await uploadToCloudinary(file)
            return productService.addImage(req.params.id, publicId)
          } catch (uploadError: any) {
            console.error('Cloudinary upload error:', uploadError)
            throw new Error(`Failed to upload image to Cloudinary: ${uploadError.message}`)
          }
        })
        await Promise.all(imagePromises)
      }

      // Fetch updated product with images
      const productWithImages = await productService.getById(req.params.id)
      const images = await productService.getImagesByProductId(req.params.id)

      return res.status(200).json({
        message: 'Product updated successfully',
        data: {
          ...productWithImages,
          images,
        },
      })
    } catch (error: any) {
      const statusCode =
        error.message.includes('not found') ? 404 : error.message.includes('already exists') ? 409 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to update product' })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      // Get all images before deleting to remove from Cloudinary
      try {
        const images = await productService.getImagesByProductId(req.params.id)
        // Delete all images from Cloudinary
        for (const image of images) {
          if (image.image) {
            await deleteFromCloudinary(image.image)
          }
        }
      } catch (err) {
        // Ignore if images not found
      }

      const result = await productService.delete(req.params.id)
      return res.status(200).json(result)
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to delete product' })
    }
  }

  // Product Image methods
  async addImage(req: Request, res: Response) {
    try {
      const { productId } = req.params

      if (!req.file) {
        return res.status(400).json({ message: 'Image is required' })
      }

      try {
        // Upload to Cloudinary and get public_id
        const publicId = await uploadToCloudinary(req.file)
        const image = await productService.addImage(productId, publicId)

        return res.status(201).json({
          message: 'Product image added successfully',
          data: image,
        })
      } catch (uploadError: any) {
        console.error('Cloudinary upload error:', uploadError)
        return res.status(500).json({
          message: `Failed to upload image to Cloudinary: ${uploadError.message}`,
        })
      }
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to add product image' })
    }
  }

  async getImages(req: Request, res: Response) {
    try {
      const images = await productService.getImagesByProductId(req.params.productId)
      return res.status(200).json({
        length: images.length,
        data: images,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch product images' })
    }
  }

  async deleteImage(req: Request, res: Response) {
    try {
      // Get image before deleting to remove from Cloudinary
      const image = await productService.getImageById(req.params.imageId)
      if (image && image.image) {
        // Delete image from Cloudinary
        await deleteFromCloudinary(image.image)
      }
      
      const result = await productService.deleteImage(req.params.imageId)
      return res.status(200).json(result)
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to delete product image' })
    }
  }
}

