import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserModel } from '../user/user.model'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    name: string
    sessionToken: string
  }
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token is required' })
    }

    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT secret not configured' })
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as unknown as {
        id: string
        email: string
        role: string
        name: string
        sessionToken: string
        exp?: number
      }

      // Verify session token matches database
      const user = await UserModel.findById(decoded.id).select('+sessionToken')
      if (!user) {
        return res.status(401).json({ message: 'User not found' })
      }

      if (user.sessionToken !== decoded.sessionToken) {
        return res.status(401).json({ message: 'Invalid session token' })
      }

      // Check if user is inactive
      if (user.status === 'Inactive') {
        return res.status(401).json({ message: 'Your account is inactive' })
      }

      // Check if user is banned
      if (user.status === 'Banned') {
        return res.status(401).json({ message: 'Your account is banned' })
      }

      // Attach user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
        sessionToken: decoded.sessionToken,
      }

      next()
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' })
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' })
      }
      return res.status(401).json({ message: 'Token verification failed' })
    }
  } catch (error: any) {
    return res.status(500).json({ message: 'Authentication error' })
  }
}

