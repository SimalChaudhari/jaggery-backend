// Use Case Service for MongoDB
import { UseCaseModel } from './use-case.model'

export interface CreateUseCaseDto {
  title: string
  image: string
}

export interface UpdateUseCaseDto {
  title?: string
  image?: string
}

export class UseCaseService {
  async create(dto: CreateUseCaseDto) {
    // Check if use case with same title already exists
    const existingUseCase = await UseCaseModel.findOne({
      title: dto.title,
    })

    if (existingUseCase) {
      throw new Error('Use case with this title already exists')
    }

    const useCase = new UseCaseModel({
      title: dto.title,
      image: dto.image,
    })

    await useCase.save()
    return useCase.toObject()
  }

  async getAll() {
    const useCases = await UseCaseModel.find().sort({ createdAt: -1 })
    return useCases.map((uc) => uc.toObject())
  }

  async getById(id: string) {
    const useCase = await UseCaseModel.findById(id)

    if (!useCase) {
      throw new Error('Use case not found')
    }

    return useCase.toObject()
  }

  async update(id: string, dto: UpdateUseCaseDto) {
    const useCase = await UseCaseModel.findById(id)

    if (!useCase) {
      throw new Error('Use case not found')
    }

    // Check if title is being updated and if it conflicts with existing use case
    if (dto.title && dto.title !== useCase.title) {
      const existingUseCase = await UseCaseModel.findOne({
        title: dto.title,
        _id: { $ne: id },
      })

      if (existingUseCase) {
        throw new Error('Use case with this title already exists')
      }
    }

    // Update fields
    if (dto.title) useCase.title = dto.title
    if (dto.image) useCase.image = dto.image

    await useCase.save()
    return useCase.toObject()
  }

  async delete(id: string) {
    const useCase = await UseCaseModel.findById(id)

    if (!useCase) {
      throw new Error('Use case not found')
    }

    // Hard delete
    await UseCaseModel.findByIdAndDelete(id)

    return { message: 'Use case deleted successfully' }
  }
}

