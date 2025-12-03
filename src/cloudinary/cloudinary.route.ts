import { Router } from 'express'
import { CloudinaryController } from './cloudinary.controller'

const cloudinaryController = new CloudinaryController()

export function attachCloudinaryRoutes(router: Router) {
  // GET /api/cloudinary/images - Fetch all images
  router.get('/cloudinary/images', cloudinaryController.getAllImages.bind(cloudinaryController))

  // GET /api/cloudinary/images/:folder - Fetch images by folder
  router.get('/cloudinary/images/:folder', cloudinaryController.getImagesByFolder.bind(cloudinaryController))
}

