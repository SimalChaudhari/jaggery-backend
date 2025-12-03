import type { Router } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import { UserController } from './user.controller'

const userController = new UserController()

export const attachUserRoutes = (router: Router) => {
  // Create new user (requires authentication)
  router.post('/users', authenticateToken, (req, res) => userController.create(req, res))

  // Get all users (requires authentication)
  router.get('/users', authenticateToken, (req, res) => userController.getAll(req, res))

  // Get user by ID (requires authentication)
  router.get('/users/:id', authenticateToken, (req, res) => userController.getById(req, res))

  // Update user (requires authentication)
  router.put('/users/:id', authenticateToken, (req, res) => userController.update(req, res))

  // Get admin state (requires authentication)
  router.get('/users/admin-state', authenticateToken, (req, res) => userController.getAdminState(req, res))

  // Update user status (requires authentication)
  router.patch('/users/status/:id', authenticateToken, (req, res) => userController.updateStatus(req, res))

  // Delete user (soft delete) (requires authentication)
  router.delete('/users/delete/:id', authenticateToken, (req, res) => userController.delete(req, res))
}

