import type { Request, Response } from 'express'
import { AddressService } from './addresses.service'
import { AuthRequest } from '../middleware/auth.middleware'

const addressService = new AddressService()

export class AddressController {
  async create(req: AuthRequest, res: Response) {
    try {
      const loggedInUserId = req.user?.id
      if (!loggedInUserId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      const { address, city, state, country, pincode, label, isDefault, user: targetUserId } = req.body

      // If admin is creating address for another user, use targetUserId, otherwise use logged-in user's ID
      const userId = req.user?.role === 'Admin' && targetUserId ? targetUserId : loggedInUserId

      const newAddress = await addressService.create({
        user: userId,
        address,
        city,
        state,
        country,
        pincode,
        label,
        isDefault,
      })

      return res.status(201).json({
        message: 'Address created successfully',
        data: newAddress,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to create address' })
    }
  }

  async getAllByUser(req: AuthRequest, res: Response) {
    try {
      const loggedInUserId = req.user?.id
      if (!loggedInUserId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      // If admin is fetching addresses for another user, use query param, otherwise use logged-in user's ID
      const targetUserId = req.user?.role === 'Admin' && req.query.userId ? req.query.userId : loggedInUserId

      const addresses = await addressService.getAllByUser(targetUserId as string)
      return res.status(200).json({
        length: addresses.length,
        data: addresses,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch addresses' })
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      const address = await addressService.getById(req.params.id)
      
      // Verify that the address belongs to the user (unless user is admin)
      if (req.user?.role !== 'Admin' && address.user.toString() !== userId) {
        return res.status(403).json({ message: 'You do not have permission to view this address' })
      }

      return res.status(200).json({
        data: address,
      })
    } catch (error: any) {
      const statusCode = error.message.includes('not found') ? 404 : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to fetch address' })
    }
  }

  async getDefault(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      const address = await addressService.getDefaultByUser(userId)
      if (!address) {
        return res.status(404).json({ message: 'No default address found' })
      }

      return res.status(200).json({
        data: address,
      })
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Failed to fetch default address' })
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      const { address, city, state, country, pincode, label, isDefault } = req.body

      const updateData: any = {}
      if (address !== undefined) updateData.address = address
      if (city !== undefined) updateData.city = city
      if (state !== undefined) updateData.state = state
      if (country !== undefined) updateData.country = country
      if (pincode !== undefined) updateData.pincode = pincode
      if (label !== undefined) updateData.label = label
      if (isDefault !== undefined) updateData.isDefault = isDefault

      // Admin can update any address, regular users can only update their own
      const checkUserId = req.user?.role === 'Admin' ? undefined : userId
      const updatedAddress = await addressService.update(req.params.id, updateData, checkUserId)

      return res.status(200).json({
        message: 'Address updated successfully',
        data: updatedAddress,
      })
    } catch (error: any) {
      const statusCode =
        error.message.includes('not found') || error.message.includes('permission')
          ? error.message.includes('not found')
            ? 404
            : 403
          : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to update address' })
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      // Admin can delete any address, regular users can only delete their own
      const checkUserId = req.user?.role === 'Admin' ? undefined : userId
      const result = await addressService.delete(req.params.id, checkUserId)
      return res.status(200).json(result)
    } catch (error: any) {
      const statusCode =
        error.message.includes('not found') || error.message.includes('permission')
          ? error.message.includes('not found')
            ? 404
            : 403
          : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to delete address' })
    }
  }

  async setDefault(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      // Get the address to find its user
      const address = await addressService.getById(req.params.id)
      // Admin can set default for any user's address, regular users can only set their own
      const targetUserId = req.user?.role === 'Admin' ? address.user.toString() : userId

      const updatedAddress = await addressService.setDefault(req.params.id, targetUserId)

      return res.status(200).json({
        message: 'Default address updated successfully',
        data: updatedAddress,
      })
    } catch (error: any) {
      const statusCode =
        error.message.includes('not found') || error.message.includes('permission')
          ? error.message.includes('not found')
            ? 404
            : 403
          : 400
      return res.status(statusCode).json({ message: error.message || 'Failed to set default address' })
    }
  }
}

