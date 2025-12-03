import type { Request, Response } from 'express'
import { UserService } from './users.service'
import { UserStatus } from './user.model'

const userService = new UserService()

export class UserController {
  async create(req: Request, res: Response) {
    try {
      const user = await userService.create(req.body)
      return res.status(201).json({
        message: 'User created successfully',
        data: user,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('already exists') ? 409 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to create user' })
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.getAll()
      return res.status(200).json({
        length: users.length,
        data: users,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch users' })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const user = await userService.getById(req.params.id)
      return res.status(200).json({
        data: user,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to fetch user' })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = await userService.update(req.params.id, req.body)
      return res.status(200).json({
        message: 'User updated successfully',
        data: user,
      })
    } catch (error: any) {
      const statusCode =
        error.message.includes('not found') || error.message.includes('deleted')
          ? 404
          : error.message.includes('already exists')
            ? 409
            : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to update user' })
    }
  }

  async getAdminState(req: Request, res: Response) {
    try {
      const state = await userService.getAdminState()
      return res.status(200).json({ state })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch admin state' })
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body
      if (!status || !Object.values(UserStatus).includes(status)) {
        return res.status(400).json({ message: 'Invalid status' })
      }

      const updatedUser = await userService.updateUserStatus(req.params.id, status)
      return res.status(200).json({
        message: `User status updated to ${status}`,
        data: updatedUser,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to update user status' })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const result = await userService.delete(req.params.id)
      return res.status(200).json(result)
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to delete user' })
    }
  }
}

