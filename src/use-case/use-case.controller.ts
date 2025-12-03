import type { Request, Response } from 'express'
import { UseCaseService } from './use-cases.service'
import cloudinary from '../lib/cloudinary'

const useCaseService = new UseCaseService()

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Convert buffer to data URI format for Cloudinary
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    
    cloudinary.uploader.upload(
      dataUri,
      {
        folder: 'use-case', // Upload to use-case folder
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          // Store the public_id in database (e.g., "use-case/filename")
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
      // If it's just a filename (old format), try to find it in use-case folder
      // Check if it already has folder prefix
      if (!imagePublicId.startsWith('use-case/')) {
        // Try with use-case folder prefix
        const filenameWithoutExt = imagePublicId.replace(/\.[^/.]+$/, '')
        // Replace spaces with underscores (Cloudinary format)
        const transformedName = filenameWithoutExt.replace(/\s+/g, '_')
        imagePublicId = `use-case/${transformedName}`
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
    // Don't throw error, just log it - use case deletion should continue even if image delete fails
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
  if (imageValue.startsWith('use-case/')) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${imageValue}`
  }
  
  // If it's just a filename (old format), construct with use-case folder
  // Replace spaces with underscores to match Cloudinary's transformation
  const transformedName = imageValue.replace(/\s+/g, '_')
  return `https://res.cloudinary.com/${cloudName}/image/upload/use-case/${transformedName}`
}

export class UseCaseController {
  async create(req: Request, res: Response) {
    try {
      const { title } = req.body
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

      if (!title || title.trim() === '') {
        return res.status(400).json({ message: 'Title is required' })
      }

      if (!image) {
        return res.status(400).json({ message: 'Image is required' })
      }

      const useCase = await useCaseService.create({ title: title.trim(), image })
      // Convert public_id to Cloudinary URL
      const useCaseWithUrl = {
        ...useCase,
        image: getImageUrl(useCase.image),
      }
      return res.status(201).json({
        message: 'Use case created successfully',
        data: useCaseWithUrl,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('already exists') ? 409 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to create use case' })
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const useCases = await useCaseService.getAll()
      // Convert image filenames/public_ids to URLs
      const useCasesWithUrls = useCases.map((useCase) => ({
        ...useCase,
        image: getImageUrl(useCase.image),
      }))
      return res.status(200).json({
        length: useCasesWithUrls.length,
        data: useCasesWithUrls,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch use cases' })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const useCase = await useCaseService.getById(req.params.id)
      // Convert image filename/public_id to URL
      const useCaseWithUrl = {
        ...useCase,
        image: getImageUrl(useCase.image),
      }
      return res.status(200).json({
        data: useCaseWithUrl,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to fetch use case' })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { title } = req.body
      let image: string | undefined

      // If file is uploaded, upload to Cloudinary
      if (req.file) {
        try {
          // Get old use case to delete old image from Cloudinary
          try {
            const oldUseCase = await useCaseService.getById(req.params.id)
            if (oldUseCase.image) {
              // Delete old image from Cloudinary
              await deleteFromCloudinary(oldUseCase.image)
            }
          } catch (err) {
            // Ignore if use case not found
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

      if (!title || title.trim() === '') {
        return res.status(400).json({ message: 'Title is required' })
      }

      const updateData: { title: string; image?: string } = { title: title.trim() }
      if (image) updateData.image = image

      const useCase = await useCaseService.update(req.params.id, updateData)
      // Convert public_id to Cloudinary URL
      const useCaseWithUrl = {
        ...useCase,
        image: getImageUrl(useCase.image),
      }
      return res.status(200).json({
        message: 'Use case updated successfully',
        data: useCaseWithUrl,
      })
    } catch (error: any) {
      const statusCode =
        error.message.includes('not found') ? 404 : error.message.includes('already exists') ? 409 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to update use case' })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      // Get use case before deleting to remove image from Cloudinary
      try {
        const useCase = await useCaseService.getById(req.params.id)
        if (useCase.image) {
          // Delete image from Cloudinary
          await deleteFromCloudinary(useCase.image)
        }
      } catch (err) {
        // Ignore if use case not found
      }

      const result = await useCaseService.delete(req.params.id)
      return res.status(200).json(result)
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to delete use case' })
    }
  }
}

