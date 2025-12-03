import mongoose, { Schema, Document } from 'mongoose'

export interface IUseCase extends Document {
  title: string
  image: string
  createdAt: Date
  updatedAt: Date
}

const UseCaseSchema = new Schema<IUseCase>(
  {
    title: { type: String, required: true, unique: true },
    image: { type: String, required: true },
  },
  {
    timestamps: true,
  },
)

export const UseCaseModel = mongoose.model<IUseCase>('usecases', UseCaseSchema)

