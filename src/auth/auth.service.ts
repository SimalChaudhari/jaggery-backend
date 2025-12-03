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

export interface ForgotPasswordDto {
  email: string
}

export interface ResetPasswordDto {
  token: string
  password: string
}

export interface VerifyEmailDto {
  token: string
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

    // Generate email verification token
    const verificationToken = uuidv4()
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

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
      isVerified: false,
      emailVerificationToken: await bcrypt.hash(verificationToken, 10),
      emailVerificationExpires: verificationExpires,
    })

    await newUser.save()

    // Send verification email (same approach as forgot password - throw error if fails)
    await this.emailService.sendVerificationEmail(email, verificationToken)

    const { password: _, otp, otpExpires, sessionToken, emailVerificationToken, emailVerificationExpires, ...userResponse } = newUser.toObject()

    return {
      message: 'User registered successfully. Please check your email to verify your account.',
      user: userResponse,
    }
  }

  async login(dto: LoginDto) {
    const { contact, password } = dto

    if (!contact) {
      throw new Error('Either email or username must be provided.')
    }

    if (!password) {
      throw new Error('Password is required.')
    }

    const isEmail = validateEmail(contact)
    // Login with email or username (not mobile)
    const whereCondition = isEmail 
      ? { email: contact } 
      : { username: contact }

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
      throw new Error('Invalid email/username or password')
    }

    // Check if user is verified - skip this check for Admin role
    if (!user.isVerified && user.role !== UserRole.Admin) {
      // Generate new verification token if expired or doesn't exist
      let verificationToken = uuidv4()
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Check if user has existing unexpired token
      if (user.emailVerificationExpires && user.emailVerificationExpires > new Date()) {
        // Token exists and is valid, but we'll still send a new one for convenience
        verificationToken = uuidv4()
      }

      // Update verification token
      user.emailVerificationToken = await bcrypt.hash(verificationToken, 10)
      user.emailVerificationExpires = verificationExpires
      await user.save()

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail(user.email, verificationToken)
        console.log(`Verification email sent to ${user.email} during login attempt`)
      } catch (error: any) {
        console.error('Failed to send verification email during login:', error)
        // Continue even if email fails - user can use resend verification
      }

      throw new Error('Your account is not verified. A verification email has been sent to your email address. Please verify your email before logging in.')
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
    const { password: _, otp, otpExpires, sessionToken, ...userResponse } = user.toObject()

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
    const whereCondition = isEmail ? { email: contact } : { mobile: contact }

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

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto

    if (!email) {
      throw new Error('Email is required')
    }

    if (!validateEmail(email)) {
      throw new Error('Invalid email format')
    }

    const user = await UserModel.findOne({ email })

    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If the email exists, a password reset link has been sent' }
    }

    // Check if user is inactive or banned
    if (user.status === UserStatus.Inactive) {
      throw new Error('Your account is inactive. Please contact the admin for assistance.')
    }

    if (user.status === UserStatus.Banned) {
      throw new Error('Your account is banned. Please contact the admin for assistance.')
    }

    // Generate reset token
    const resetToken = uuidv4()
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    user.resetPasswordToken = await bcrypt.hash(resetToken, 10)
    user.resetPasswordExpires = resetTokenExpires
    await user.save()

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken)

    return { message: 'If the email exists, a password reset link has been sent' }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, password } = dto

    if (!token) {
      throw new Error('Reset token is required')
    }

    if (!password) {
      throw new Error('Password is required')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Find user with reset token
    const users = await UserModel.find({
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken')

    let user = null
    for (const u of users) {
      if (u.resetPasswordToken && await bcrypt.compare(token, u.resetPasswordToken)) {
        user = u
        break
      }
    }

    if (!user) {
      throw new Error('Invalid or expired reset token')
    }

    // Check if user is inactive or banned
    if (user.status === UserStatus.Inactive) {
      throw new Error('Your account is inactive. Please contact the admin for assistance.')
    }

    if (user.status === UserStatus.Banned) {
      throw new Error('Your account is banned. Please contact the admin for assistance.')
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update password and clear reset token
    user.password = passwordHash
    user.resetPasswordToken = null
    user.resetPasswordExpires = undefined
    await user.save()

    return { message: 'Password reset successfully' }
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { token } = dto

    if (!token) {
      throw new Error('Verification token is required.')
    }

    // Find users with unexpired verification tokens
    const users = await UserModel.find({
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken')

    let user = null
    for (const u of users) {
      if (u.emailVerificationToken && (await bcrypt.compare(token, u.emailVerificationToken))) {
        user = u
        break
      }
    }

    if (!user) {
      throw new Error('Invalid or expired verification token.')
    }

    // Mark user as verified and clear verification token
    user.isVerified = true
    user.emailVerificationToken = null
    user.emailVerificationExpires = null
    await user.save()

    return { message: 'Email verified successfully. You can now login.' }
  }

  async resendVerificationEmail(dto: ForgotPasswordDto) {
    const { email } = dto

    if (!email) {
      throw new Error('Email is required')
    }

    if (!validateEmail(email)) {
      throw new Error('Invalid email format')
    }

    const user = await UserModel.findOne({ email })

    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If the email exists and is not verified, a verification link has been sent' }
    }

    // If user is already verified, don't send email
    if (user.isVerified) {
      return { message: 'Your email is already verified. You can login now.' }
    }

    // Generate new verification token
    const verificationToken = uuidv4()
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    user.emailVerificationToken = await bcrypt.hash(verificationToken, 10)
    user.emailVerificationExpires = verificationExpires
    await user.save()

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(email, verificationToken)
      console.log(`Resent verification email to ${email}`)
    } catch (error: any) {
      console.error('Failed to resend verification email:', error)
      throw new Error('Failed to send verification email. Please try again later.')
    }

    return { message: 'If the email exists and is not verified, a verification link has been sent' }
  }
}
