// Product Service for MongoDB
import { ProductModel } from './product.model'
import { ProductImageModel } from './product-image.model'
import cloudinary from '../lib/cloudinary'

export interface SizePriceDto {
  sizeId: string
  actualPrice: number
  discountPrice?: number
}

export interface CreateProductDto {
  title: string
  description: string
  benefits?: string
  ingredients?: string
  storageConditions?: string
  actualPrice: number
  discountPrice?: number
  isSale: boolean
  inStock: boolean
  categories: string[] // Array of category IDs
  useCases?: string[] // Array of use case IDs
  sizes?: string[] // Array of size IDs
  sizePrices?: SizePriceDto[] // Array of size-specific prices
}

export interface UpdateProductDto {
  title?: string
  description?: string
  benefits?: string
  ingredients?: string
  storageConditions?: string
  actualPrice?: number
  discountPrice?: number
  isSale?: boolean
  inStock?: boolean
  categories?: string[] // Array of category IDs
  useCases?: string[] // Array of use case IDs
  sizes?: string[] // Array of size IDs
  sizePrices?: SizePriceDto[] // Array of size-specific prices
}

// Helper function to get Cloudinary URL from public_id or filename
function getImageUrl(imageValue: string): string {
  if (!imageValue) return ''
  
  // If already a full URL, return as is
  if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
    return imageValue
  }
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dwijhft25'
  
  // If it's a public_id with folder (new format), use directly
  if (imageValue.startsWith('product/')) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${imageValue}`
  }
  
  // If it's just a filename (old format), construct with product folder
  // Replace spaces with underscores to match Cloudinary's transformation
  const transformedName = imageValue.replace(/\s+/g, '_')
  return `https://res.cloudinary.com/${cloudName}/image/upload/product/${transformedName}`
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
    // Don't throw error, just log it
  }
}

export class ProductService {
  async create(dto: CreateProductDto) {
    const product = new ProductModel({
      title: dto.title,
      description: dto.description,
      benefits: dto.benefits,
      ingredients: dto.ingredients,
      storageConditions: dto.storageConditions,
      actualPrice: dto.actualPrice,
      discountPrice: dto.discountPrice,
      isSale: dto.isSale ?? false,
      inStock: dto.inStock ?? true,
      categories: dto.categories,
      useCases: dto.useCases || [],
      sizes: dto.sizes || [],
      sizePrices: dto.sizePrices || [],
    })

    await product.save()
    return product.toObject()
  }

  async getAll() {
    const products = await ProductModel.find()
      .populate('categories', 'title')
      .populate('useCases', 'title')
      .populate('sizes', 'title')
      .sort({ createdAt: -1 })
    return products.map((product) => product.toObject())
  }

  async getById(id: string) {
    const product = await ProductModel.findById(id)
      .populate('categories', 'title')
      .populate('useCases', 'title')
      .populate('sizes', 'title')

    if (!product) {
      throw new Error('Product not found')
    }

    return product.toObject()
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await ProductModel.findById(id)

    if (!product) {
      throw new Error('Product not found')
    }

          // Update fields
          if (dto.title) product.title = dto.title
          if (dto.description) product.description = dto.description
          if (dto.benefits !== undefined) product.benefits = dto.benefits
          if (dto.ingredients !== undefined) product.ingredients = dto.ingredients
          if (dto.storageConditions !== undefined) product.storageConditions = dto.storageConditions
          if (dto.actualPrice !== undefined) product.actualPrice = dto.actualPrice
          if (dto.discountPrice !== undefined) product.discountPrice = dto.discountPrice
          if (dto.isSale !== undefined) product.isSale = dto.isSale
          if (dto.inStock !== undefined) product.inStock = dto.inStock
          if (dto.categories) product.categories = dto.categories as any
          if (dto.useCases !== undefined) product.useCases = dto.useCases as any
          if (dto.sizes !== undefined) product.sizes = dto.sizes as any
          if (dto.sizePrices !== undefined) product.sizePrices = dto.sizePrices as any

    await product.save()
    return product.toObject()
  }

  async delete(id: string) {
    const product = await ProductModel.findById(id)

    if (!product) {
      throw new Error('Product not found')
    }

    // Delete all associated images (including physical files)
    await this.deleteAllImagesByProductId(id)

    // Hard delete product
    await ProductModel.findByIdAndDelete(id)

    return { message: 'Product deleted successfully' }
  }

  // Product Image methods
  async addImage(productId: string, publicId: string) {
    const product = await ProductModel.findById(productId)

    if (!product) {
      throw new Error('Product not found')
    }

    // Store the public_id, and return URL in response
    const imageUrl = getImageUrl(publicId)
    const productImage = new ProductImageModel({
      productId,
      image: publicId, // Store public_id in database
    })

    await productImage.save()
    const imageObj = productImage.toObject()
    // Return with URL for frontend
    return {
      ...imageObj,
      image: imageUrl, // Return URL instead of public_id
    }
  }

  async getImagesByProductId(productId: string) {
    const images = await ProductImageModel.find({ productId }).sort({ createdAt: -1 })
    return images.map((img) => {
      const imgObj = img.toObject()
      // Convert filename to URL
      return {
        ...imgObj,
        image: getImageUrl(imgObj.image),
      }
    })
  }

  async getImageById(imageId: string) {
    const image = await ProductImageModel.findById(imageId)
    if (!image) {
      throw new Error('Product image not found')
    }
    const imageObj = image.toObject()
    return {
      ...imageObj,
      image: imageObj.image, // Return public_id (not URL)
    }
  }

  async deleteImage(imageId: string) {
    const image = await ProductImageModel.findById(imageId)

    if (!image) {
      throw new Error('Product image not found')
    }

    // Delete the image from Cloudinary
    const imageObj = image.toObject()
    const imageValue = imageObj.image
    if (imageValue) {
      await deleteFromCloudinary(imageValue)
    }

    // Delete from database
    await ProductImageModel.findByIdAndDelete(imageId)
    return { message: 'Product image deleted successfully' }
  }

  async deleteAllImagesByProductId(productId: string) {
    // Get all images for this product
    const images = await ProductImageModel.find({ productId })
    
    // Delete images from Cloudinary
    for (const image of images) {
      const imageObj = image.toObject()
      const imageValue = imageObj.image
      if (imageValue) {
        await deleteFromCloudinary(imageValue)
      }
    }

    // Delete from database
    await ProductImageModel.deleteMany({ productId })
    return { message: 'All product images deleted successfully' }
  }
}

