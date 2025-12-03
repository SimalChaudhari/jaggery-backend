import type { Request, Response } from 'express'
import cloudinary from '../lib/cloudinary'

export class CloudinaryController {
  async getAllImages(req: Request, res: Response) {
    try {
      // Fetch all images from Cloudinary
      const result = await cloudinary.search
        .expression('resource_type:image') // all images
        .sort_by('created_at', 'desc')
        .max_results(1000)
        .execute()

      return res.status(200).json({
        length: result.resources.length,
        data: result.resources,
      })
    } catch (error: any) {
      console.error('Error fetching Cloudinary images:', error)
      return res.status(500).json({
        message: error.message || 'Failed to fetch images from Cloudinary',
      })
    }
  }

  async getImagesByFolder(req: Request, res: Response) {
    try {
      const { folder } = req.params

      // Fetch images from specific folder
      const result = await cloudinary.search
        .expression(`resource_type:image AND folder:${folder}`)
        .sort_by('created_at', 'desc')
        .max_results(1000)
        .execute()

      return res.status(200).json({
        length: result.resources.length,
        data: result.resources,
      })
    } catch (error: any) {
      console.error('Error fetching Cloudinary images by folder:', error)
      return res.status(500).json({
        message: error.message || 'Failed to fetch images from Cloudinary',
      })
    }
  }
}

