// Email Service
import * as nodemailer from 'nodemailer'

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendOTP(email: string, otp: string): Promise<string> {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333; text-align: center;">One-Time Password (OTP)</h2>
          <p style="color: #555; font-size: 16px;">Dear User,</p>
          <p style="color: #555; font-size: 16px;">You requested a one-time password (OTP) to access your account. Use the code below to proceed:</p>
          <div style="text-align: center; margin: 20px;">
            <span style="font-size: 24px; font-weight: bold; color: #2d89ef; border: 2px dashed #2d89ef; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #555; font-size: 16px;">This OTP is valid for the next <strong>5 minutes</strong>. If you did not request this, please ignore this email or contact support.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #777; font-size: 12px; text-align: center;">If you have any questions, feel free to reach out to our support team.</p>
        </div>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`OTP sent to ${email}: ${otp}`)
      return otp
    } catch (error) {
      throw new Error('Failed to send OTP')
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3030'}/auth/reset-password?token=${resetToken}`
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click the following link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p style="color: #555; font-size: 16px;">Dear User,</p>
          <p style="color: #555; font-size: 16px;">You requested to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 20px;">
            <a href="${resetUrl}" style="background-color: #2d89ef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #555; font-size: 16px;">Or copy and paste this link into your browser:</p>
          <p style="color: #2d89ef; font-size: 14px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #555; font-size: 16px;">This link is valid for the next <strong>1 hour</strong>. If you did not request this, please ignore this email or contact support.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #777; font-size: 12px; text-align: center;">If you have any questions, feel free to reach out to our support team.</p>
        </div>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log(`Password reset email sent to ${email}`)
    } catch (error) {
      throw new Error('Failed to send password reset email')
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3030'}/auth/verify?token=${verificationToken}`
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Verify Your Email Address',
      text: `Click the following link to verify your email: ${verifyUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #333; text-align: center;">Verify Your Email Address</h2>
          <p style="color: #555; font-size: 16px;">Dear User,</p>
          <p style="color: #555; font-size: 16px;">Thank you for registering! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 20px;">
            <a href="${verifyUrl}" style="background-color: #2d89ef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #555; font-size: 16px;">Or copy and paste this link into your browser:</p>
          <p style="color: #2d89ef; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
          <p style="color: #555; font-size: 16px;">This link will expire in <strong>24 hours</strong>. If you did not create an account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #777; font-size: 12px; text-align: center;">If you have any questions, feel free to reach out to our support team.</p>
        </div>
      `,
    }

    try {
      const result = await this.transporter.sendMail(mailOptions)
      console.log(`Verification email sent to ${email}`)
      console.log('Email send result:', result.messageId || 'Sent')
      return result
    } catch (error: any) {
      console.error('Email service error details:')
      console.error('- Error message:', error.message || error)
      console.error('- Error code:', error.code)
      console.error('- SMTP User:', process.env.SMTP_USER ? 'Set' : 'Missing')
      console.error('- SMTP Pass:', process.env.SMTP_PASS ? 'Set' : 'Missing')
      console.error('- Frontend URL:', process.env.FRONTEND_URL || 'Not set')
      throw new Error(`Failed to send verification email: ${error.message || 'Unknown error'}`)
    }
  }
}
