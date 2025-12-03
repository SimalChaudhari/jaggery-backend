import type { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { AuthService } from './auth.service'
import { UserService } from '../user/users.service'

const authService = new AuthService()
const userService = new UserService()

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body)
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Registration failed' })
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body)
      return res.status(200).json(result)
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('Invalid') || error.message.includes('inactive') || error.message.includes('not set')
          ? 401
          : 400
      return res.status(statusCode).json({
        message: error.message || 'Login failed. Please check your credentials and try again.',
      })
    }
  }

  async verifyOtp(req: Request, res: Response) {
    try {
      const result = await authService.verifyOtp(req.body)
      return res.status(200).json(result)
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('Inactive')
          ? 401
          : 400
      return res.status(statusCode).json({
        message: error.message || 'OTP failed. Please check your credentials and try again.',
      })
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      const user = await userService.getById(req.user.id)
      return res.status(200).json({
        data: user,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to fetch profile' })
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' })
      }

      const user = await userService.update(req.user.id, req.body)
      return res.status(200).json({
        message: 'Profile updated successfully',
        data: user,
      })
    } catch (error: any) {
      const statusCode =
        error.message.includes('not found') || error.message.includes('deleted')
          ? 404
          : error.message.includes('already exists')
            ? 409
            : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to update profile' })
    }
  }
}

