import type { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { AuthController } from './auth.controller'

const authController = new AuthController()

export const attachAuthRoutes = (router: Router) => {
  // Register
  router.post('/auth/register', (req, res) => authController.register(req, res))

  // Login
  router.post('/auth/login', (req, res) => authController.login(req, res))

  // Verify OTP
  router.post('/auth/verify-otp', (req, res) => authController.verifyOtp(req, res))

  // Profile routes (requires authentication)
  router.get('/auth/profile', authenticateToken, (req, res) => authController.getProfile(req, res))
  router.put('/auth/profile', authenticateToken, (req, res) => authController.updateProfile(req, res))

  // Password reset routes
  router.post('/auth/forgot-password', (req, res) => authController.forgotPassword(req, res))
  router.post('/auth/reset-password', (req, res) => authController.resetPassword(req, res))

  // Email verification routes
  router.post('/auth/verify-email', (req, res) => authController.verifyEmail(req, res))
  router.post('/auth/resend-verification', (req, res) => authController.resendVerificationEmail(req, res))
}

