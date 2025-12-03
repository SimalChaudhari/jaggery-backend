import mongoose, { Schema, Document } from 'mongoose'

export enum UserRole {
  Admin = 'Admin',
  User = 'User',
}

export enum UserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending',
  Banned = 'Banned',
}

export interface IUser extends Document {
  username?: string
  firstname?: string
  lastname?: string
  email: string
  mobile: string
  password?: string | null
  role: UserRole
  status: UserStatus
  address?: string
  country?: string
  state?: string
  city?: string
  pincode?: string
  isVerified?: boolean
  otp?: string | null
  otpExpires?: Date | null
  resetPasswordToken?: string | null
  resetPasswordExpires?: Date | null
  emailVerificationToken?: string | null
  emailVerificationExpires?: Date | null
  sessionToken?: string | null
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String },
    firstname: { type: String },
    lastname: { type: String },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.User },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.Active },
    address: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpires: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date },
    sessionToken: { type: String },
  },
  {
    timestamps: true,
  },
)

export const UserModel = mongoose.model<IUser>('users', UserSchema)

