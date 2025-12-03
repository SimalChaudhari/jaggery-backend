import type { Request, Response } from 'express'
import { CategoryService } from './categories.service'
import cloudinary from '../lib/cloudinary'

const categoryService = new CategoryService()

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Convert buffer to data URI format for Cloudinary
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    
    cloudinary.uploader.upload(
      dataUri,
      {
        folder: 'category', // Upload to category folder
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          // Store the public_id in database (e.g., "category/filename")
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
      // If it's just a filename (old format), try to find it in category folder
      // Check if it already has folder prefix
      if (!imagePublicId.startsWith('category/')) {
        // Try with category folder prefix
        const filenameWithoutExt = imagePublicId.replace(/\.[^/.]+$/, '')
        // Replace spaces with underscores (Cloudinary format)
        const transformedName = filenameWithoutExt.replace(/\s+/g, '_')
        imagePublicId = `category/${transformedName}`
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
    // Don't throw error, just log it - category deletion should continue even if image delete fails
  }
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
  if (imageValue.startsWith('category/')) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${imageValue}`
  }
  
  // If it's just a filename (old format), construct with category folder
  // Replace spaces with underscores to match Cloudinary's transformation
  const transformedName = imageValue.replace(/\s+/g, '_')
  return `https://res.cloudinary.com/${cloudName}/image/upload/category/${transformedName}`
}

export class CategoryController {
  async create(req: Request, res: Response) {
    try {
      const { title, description, parentCategory } = req.body
      let image = ''

      // If file is uploaded, upload to Cloudinary
      if (req.file) {
        try {
          // Upload to Cloudinary and get public_id
          const publicId = await uploadToCloudinary(req.file)
          image = publicId
        } catch (uploadError: any) {
          console.error('Cloudinary upload error:', uploadError)
          return res.status(500).json({
            message: `Failed to upload image to Cloudinary: ${uploadError.message}`,
          })
        }
      } else if (req.body.image) {
        // For backward compatibility (if image URL is provided directly)
        image = req.body.image
      }

      if (!image) {
        return res.status(400).json({ message: 'Image is required' })
      }

      if (!description) {
        return res.status(400).json({ message: 'Description is required' })
      }

      const category = await categoryService.create({ title, description, image, parentCategory })
      // Convert public_id to Cloudinary URL
      const categoryWithUrl = {
        ...category,
        image: getImageUrl(category.image),
      }
      return res.status(201).json({
        message: 'Category created successfully',
        data: categoryWithUrl,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('already exists') ? 409 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to create category' })
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const categories = await categoryService.getAll()
      // Convert image filenames to URLs
      const categoriesWithUrls = categories.map((category) => ({
        ...category,
        image: getImageUrl(category.image),
      }))
      return res.status(200).json({
        length: categoriesWithUrls.length,
        data: categoriesWithUrls,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch categories' })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const category = await categoryService.getById(req.params.id)
      // Convert image filename to URL
      const categoryWithUrl = {
        ...category,
        image: getImageUrl(category.image),
      }
      return res.status(200).json({
        data: categoryWithUrl,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to fetch category' })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { title, description, parentCategory } = req.body
      let image: string | undefined

      // If file is uploaded, upload to Cloudinary
      if (req.file) {
        try {
          // Get old category to delete old image from Cloudinary
          try {
            const oldCategory = await categoryService.getById(req.params.id)
            if (oldCategory.image) {
              // Delete old image from Cloudinary
              await deleteFromCloudinary(oldCategory.image)
            }
          } catch (err) {
            // Ignore if category not found
          }

          // Upload new image to Cloudinary
          const publicId = await uploadToCloudinary(req.file)
          image = publicId
        } catch (uploadError: any) {
          console.error('Cloudinary upload error:', uploadError)
          return res.status(500).json({
            message: `Failed to upload image to Cloudinary: ${uploadError.message}`,
          })
        }
      }

      const updateData: { title?: string; description?: string; image?: string; parentCategory?: string | null } = {}
      if (title) updateData.title = title
      if (description) updateData.description = description
      if (image) updateData.image = image
      // Handle parentCategory - if it's an empty string, set to null to clear it
      if (parentCategory !== undefined) {
        updateData.parentCategory = parentCategory && parentCategory.trim() !== '' ? parentCategory : null
      }

      const category = await categoryService.update(req.params.id, updateData)
      // Convert public_id to Cloudinary URL
      const categoryWithUrl = {
        ...category,
        image: getImageUrl(category.image),
      }
      return res.status(200).json({
        message: 'Category updated successfully',
        data: categoryWithUrl,
      })
    } catch (error: any) {
      const statusCode =
        error.message.includes('not found') ? 404 : error.message.includes('already exists') ? 409 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to update category' })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      // Get category before deleting to remove image from Cloudinary
      try {
        const category = await categoryService.getById(req.params.id)
        if (category.image) {
          // Delete image from Cloudinary
          await deleteFromCloudinary(category.image)
        }
      } catch (err) {
        // Ignore if category not found
      }

      const result = await categoryService.delete(req.params.id)
      return res.status(200).json(result)
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to delete category' })
    }
  }
}

