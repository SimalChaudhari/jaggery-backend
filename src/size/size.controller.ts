import type { Request, Response } from 'express'
import { SizeService } from './sizes.service'

const sizeService = new SizeService()

export class SizeController {
  async create(req: Request, res: Response) {
    try {
      const { title } = req.body

      if (!title || title.trim() === '') {
        return res.status(400).json({ message: 'Title is required' })
      }

      const size = await sizeService.create({ title: title.trim() })
      return res.status(201).json({
        message: 'Size created successfully',
        data: size,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('already exists') ? 409 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to create size' })
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const sizes = await sizeService.getAll()
      return res.status(200).json({
        length: sizes.length,
        data: sizes,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch sizes' })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const size = await sizeService.getById(req.params.id)
      return res.status(200).json({
        data: size,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to fetch size' })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { title } = req.body

      if (!title || title.trim() === '') {
        return res.status(400).json({ message: 'Title is required' })
      }

      const size = await sizeService.update(req.params.id, { title: title.trim() })
      return res.status(200).json({
        message: 'Size updated successfully',
        data: size,
      })
    } catch (error: any) {
      const statusCode =
        error.message.includes('not found') ? 404 : error.message.includes('already exists') ? 409 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to update size' })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await sizeService.delete(req.params.id)
      return res.status(200).json(result)
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to delete size' })
    }
  }
}

