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
}
