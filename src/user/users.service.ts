// User Service for MongoDB
import bcrypt from 'bcrypt'
import { UserModel, UserRole, UserStatus } from './user.model'

export interface CreateUserDto {
  username?: string
  firstname?: string
  lastname?: string
  email: string
  mobile: string
  password?: string
  role?: UserRole
  status?: UserStatus
  address?: string
  country?: string
  state?: string
  city?: string
  pincode?: string
  isVerified?: boolean
}

export interface UpdateUserDto {
  username?: string
  firstname?: string
  lastname?: string
  email?: string
  mobile?: string
  password?: string
  role?: UserRole
  status?: UserStatus
  address?: string
  country?: string
  state?: string
  city?: string
  pincode?: string
  isVerified?: boolean
}

export class UserService {
  async getAll() {
    return await UserModel.find({ isDeleted: false, role: { $ne: UserRole.Admin } }).select('-password -otp -otpExpires -sessionToken')
  }

  async getById(id: string) {
    const user = await UserModel.findOne({ _id: id, isDeleted: false }).select('-password -otp -otpExpires -sessionToken')
    if (!user) {
      throw new Error('User not found or has been deleted')
    }
    return user
  }

  async create(dto: CreateUserDto) {
    const { username, firstname, lastname, email, mobile, password, role, status, address, country, state, city, pincode, isVerified } = dto

    // At least one of firstname, lastname, or username should be provided
    if ((!firstname && !lastname && !username) || !email || !mobile) {
      throw new Error('Firstname/lastname (or username), email, and mobile are required')
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { mobile }],
    })

    if (existingUser) {
      throw new Error('Email or Mobile number already exists')
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null

    const newUser = new UserModel({
      username,
      firstname,
      lastname,
      email,
      mobile,
      password: passwordHash,
      role: role || UserRole.User,
      status: status || UserStatus.Active,
      address,
      country,
      state,
      city,
      pincode,
      isVerified: isVerified || false,
      isDeleted: false,
    })

    await newUser.save()

    const { password: _, otp, otpExpires, sessionToken, isDeleted, ...userResponse } = newUser.toObject()
    return userResponse
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await UserModel.findById(id)
    if (!user) {
      throw new Error('User not found')
    }

    if (user.isDeleted) {
      throw new Error('User has been deleted')
    }

    // Check if email or mobile is being updated and already exists
    if (dto.email && dto.email !== user.email) {
      const existingUser = await UserModel.findOne({ email: dto.email, _id: { $ne: id } })
      if (existingUser) {
        throw new Error('Email already exists')
      }
    }

    if (dto.mobile && dto.mobile !== user.mobile) {
      const existingUser = await UserModel.findOne({ mobile: dto.mobile, _id: { $ne: id } })
      if (existingUser) {
        throw new Error('Mobile number already exists')
      }
    }

    // Update password if provided
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10)
    }

    // Update other fields
    if (dto.username !== undefined) user.username = dto.username
    if (dto.firstname !== undefined) user.firstname = dto.firstname
    if (dto.lastname !== undefined) user.lastname = dto.lastname
    if (dto.email) user.email = dto.email
    if (dto.mobile) user.mobile = dto.mobile
    if (dto.role && Object.values(UserRole).includes(dto.role)) user.role = dto.role
    if (dto.status && Object.values(UserStatus).includes(dto.status)) user.status = dto.status
    if (dto.address !== undefined) user.address = dto.address
    if (dto.country !== undefined) user.country = dto.country
    if (dto.state !== undefined) user.state = dto.state
    if (dto.city !== undefined) user.city = dto.city
    if (dto.pincode !== undefined) user.pincode = dto.pincode
    if (dto.isVerified !== undefined) user.isVerified = dto.isVerified

    await user.save()

    const { password: _, otp, otpExpires, sessionToken, isDeleted, ...userResponse } = user.toObject()
    return userResponse
  }

  async updateUserStatus(id: string, status: UserStatus) {
    const user = await UserModel.findById(id)
    if (!user) {
      throw new Error('User not found')
    }

    if (!Object.values(UserStatus).includes(status)) {
      throw new Error('Invalid user status')
    }

    user.status = status
    await user.save()

    const { password, otp, otpExpires, sessionToken, isDeleted, ...userResponse } = user.toObject()
    return userResponse
  }

  async getAdminState(): Promise<string | null> {
    const admin = await UserModel.findOne({ role: UserRole.Admin }).select('state')
    return admin?.state ?? null
  }

  async delete(id: string) {
    const user = await UserModel.findById(id)
    if (!user) {
      throw new Error('User not found')
    }

    user.isDeleted = true
    await user.save()

    return { message: 'User deleted successfully' }
  }
}
