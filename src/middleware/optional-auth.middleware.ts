import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserModel } from '../user/user.model'
import { AuthRequest } from './auth.middleware'

// Optional authentication - doesn't fail if no token, but attaches user if token is valid
export const optionalAuthenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return next() // No token, continue without user
    }

    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      return next() // No secret, continue without user
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
      if (user && !user.isDeleted && user.status !== 'Inactive' && user.status !== 'Banned') {
        if (user.sessionToken === decoded.sessionToken) {
          // Attach user info to request
          req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name,
            sessionToken: decoded.sessionToken,
          }
        }
      }
    } catch (error) {
      // Invalid token, continue without user
    }

    next()
  } catch (error) {
    next() // Continue without user on any error
  }
}

