// Address Service for MongoDB
import mongoose from 'mongoose'
import { AddressModel } from './address.model'

export interface CreateAddressDto {
  user: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  label?: string
  isDefault?: boolean
}

export interface UpdateAddressDto {
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  label?: string
  isDefault?: boolean
}

export class AddressService {
  async create(dto: CreateAddressDto) {
    const { user, address, city, state, country, pincode, label, isDefault } = dto

    // Validate required fields
    if (!address || !city || !state || !country || !pincode) {
      throw new Error('Address, city, state, country, and pincode are required')
    }

    // If this address is set as default, unset other default addresses for this user
    if (isDefault) {
      await AddressModel.updateMany(
        { user: new mongoose.Types.ObjectId(user) },
        { isDefault: false }
      )
    }

    const newAddress = new AddressModel({
      user: new mongoose.Types.ObjectId(user),
      address,
      city,
      state,
      country,
      pincode,
      label,
      isDefault: isDefault || false,
    })

    await newAddress.save()
    return newAddress.toObject()
  }

  async getAllByUser(userId: string) {
    const addresses = await AddressModel.find({ user: new mongoose.Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 }) // Default address first, then by creation date
    return addresses.map((addr) => addr.toObject())
  }

  async getById(id: string) {
    const address = await AddressModel.findById(id)
    if (!address) {
      throw new Error('Address not found')
    }
    return address.toObject()
  }

  async getDefaultByUser(userId: string) {
    const address = await AddressModel.findOne({
      user: new mongoose.Types.ObjectId(userId),
      isDefault: true,
    })
    return address ? address.toObject() : null
  }

  async update(id: string, dto: UpdateAddressDto, userId?: string) {
    const address = await AddressModel.findById(id)
    if (!address) {
      throw new Error('Address not found')
    }

    // Verify that the address belongs to the user (if userId is provided)
    if (userId && address.user.toString() !== userId) {
      throw new Error('You do not have permission to update this address')
    }

    // If this address is being set as default, unset other default addresses for this user
    if (dto.isDefault === true) {
      await AddressModel.updateMany(
        { user: address.user, _id: { $ne: id } },
        { isDefault: false }
      )
    }

    // Update fields
    if (dto.address !== undefined) address.address = dto.address
    if (dto.city !== undefined) address.city = dto.city
    if (dto.state !== undefined) address.state = dto.state
    if (dto.country !== undefined) address.country = dto.country
    if (dto.pincode !== undefined) address.pincode = dto.pincode
    if (dto.label !== undefined) address.label = dto.label
    if (dto.isDefault !== undefined) address.isDefault = dto.isDefault

    await address.save()
    return address.toObject()
  }

  async delete(id: string, userId?: string) {
    const address = await AddressModel.findById(id)
    if (!address) {
      throw new Error('Address not found')
    }

    // Verify that the address belongs to the user (if userId is provided)
    if (userId && address.user.toString() !== userId) {
      throw new Error('You do not have permission to delete this address')
    }

    // Hard delete
    await AddressModel.findByIdAndDelete(id)

    return { message: 'Address deleted successfully' }
  }

  async setDefault(id: string, userId: string) {
    const address = await AddressModel.findById(id)
    if (!address) {
      throw new Error('Address not found')
    }

    // Verify that the address belongs to the user
    if (address.user.toString() !== userId) {
      throw new Error('You do not have permission to update this address')
    }

    // Unset other default addresses for this user
    await AddressModel.updateMany(
      { user: new mongoose.Types.ObjectId(userId), _id: { $ne: id } },
      { isDefault: false }
    )

    // Set this address as default
    address.isDefault = true
    await address.save()

    return address.toObject()
  }
}

