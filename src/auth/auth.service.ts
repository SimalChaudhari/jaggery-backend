// Auth Service for MongoDB
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { UserModel, UserRole, UserStatus } from '../user/user.model'
import { EmailService } from '../service/email.service'

const validateEmail = (input: string | undefined): boolean => {
  if (!input) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(input)
}

export interface RegisterDto {
  firstname?: string
  lastname?: string
  username?: string
  email: string
  mobile: string
  password?: string
  address?: string
  country?: string
  state?: string
  pincode?: string
}

export interface LoginDto {
  contact: string
  password: string
}

export interface VerifyOtpDto {
  contact: string
}

export class AuthService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  async register(dto: RegisterDto) {
    const { firstname, lastname, username, email, mobile, password, address, country, state, pincode } = dto

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
      firstname,
      lastname,
      username,
      email,
      mobile,
      password: passwordHash,
      address,
      country,
      state,
      pincode,
      role: UserRole.User,
      isDeleted: false,
    })

    await newUser.save()

    const { password: _, otp, otpExpires, sessionToken, isDeleted, ...userResponse } = newUser.toObject()

    return {
      message: 'User data Added successfully',
      user: userResponse,
    }
  }

  async login(dto: LoginDto) {
    const { contact, password } = dto

    if (!contact) {
      throw new Error('Either email or mobile number must be provided.')
    }

    if (!password) {
      throw new Error('Password is required.')
    }

    const isEmail = validateEmail(contact)
    const whereCondition = isEmail ? { email: contact, isDeleted: false } : { mobile: contact, isDeleted: false }

    // Find user with password field
    const user = await UserModel.findOne(whereCondition).select('+password')

    if (!user) {
      throw new Error('User not found')
    }

    // Check if user is inactive
    if (user.status === UserStatus.Inactive) {
      throw new Error('Your account is inactive. Please contact the admin for assistance.')
    }

    // Check if user is banned
    if (user.status === UserStatus.Banned) {
      throw new Error('Your account is banned. Please contact the admin for assistance.')
    }

    // Check if password is set
    if (!user.password) {
      throw new Error('Password not set. Please contact admin to set your password.')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid email or password')
    }

    // Generate session token
    const newSessionToken = uuidv4()
    user.sessionToken = newSessionToken
    await user.save()

    // Generate JWT with expiration (3 days)
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT secret not configured')
    }
        
    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
      name: user.username,
      sessionToken: newSessionToken,
    }
    const access_token = jwt.sign(payload, jwtSecret, { expiresIn: '3d' })

    // Exclude sensitive fields
    const { password: _, otp, otpExpires, sessionToken, isDeleted, ...userResponse } = user.toObject()

    return {
      message: 'User Logged in successfully',
      user: userResponse,
      access_token,
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { contact } = dto

    if (!contact) {
      throw new Error('Either email or mobile number must be provided.')
    }

    const isEmail = validateEmail(contact)
    const whereCondition = isEmail ? { email: contact, isDeleted: false } : { mobile: contact, isDeleted: false }

    const user = await UserModel.findOne(whereCondition).select('+otp')

    if (!user) {
      throw new Error('User not found')
    }

    // Check if user is inactive
    if (user.status === UserStatus.Inactive) {
      throw new Error('You are Inactive. Please contact the admin or company for assistance.')
    }

    // Check if user is banned
    if (user.status === UserStatus.Banned) {
      throw new Error('You are Banned. Please contact the admin or company for assistance.')
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    user.otp = await bcrypt.hash(otp, 10)
    user.otpExpires = otpExpires
    await user.save()

    // Send OTP via email service
    await this.emailService.sendOTP(user.email, otp)

    return { message: 'OTP sent successfully' }
  }
}
