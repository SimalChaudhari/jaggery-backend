// Size Service for MongoDB
import { SizeModel } from './size.model'

export interface CreateSizeDto {
  title: string
}

export interface UpdateSizeDto {
  title?: string
}

export class SizeService {
  async create(dto: CreateSizeDto) {
    // Check if size with same title already exists
    const existingSize = await SizeModel.findOne({
      title: dto.title,
    })

    if (existingSize) {
      throw new Error('Size with this title already exists')
    }

    const size = new SizeModel({
      title: dto.title,
    })

    await size.save()
    return size.toObject()
  }

  async getAll() {
    const sizes = await SizeModel.find().sort({ createdAt: -1 })
    return sizes.map((size) => size.toObject())
  }

  async getById(id: string) {
    const size = await SizeModel.findById(id)

    if (!size) {
      throw new Error('Size not found')
    }

    return size.toObject()
  }

  async update(id: string, dto: UpdateSizeDto) {
    const size = await SizeModel.findById(id)

    if (!size) {
      throw new Error('Size not found')
    }

    // Check if title is being updated and if it conflicts with existing size
    if (dto.title && dto.title !== size.title) {
      const existingSize = await SizeModel.findOne({
        title: dto.title,
        _id: { $ne: id },
      })

      if (existingSize) {
        throw new Error('Size with this title already exists')
      }
    }

    // Update fields
    if (dto.title) size.title = dto.title

    await size.save()
    return size.toObject()
  }

  async delete(id: string) {
    const size = await SizeModel.findById(id)

    if (!size) {
      throw new Error('Size not found')
    }

    // Hard delete
    await SizeModel.findByIdAndDelete(id)

    return { message: 'Size deleted successfully' }
  }
}

