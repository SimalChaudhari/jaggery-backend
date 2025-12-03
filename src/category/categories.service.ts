// Category Service for MongoDB
import mongoose from 'mongoose'
import { CategoryModel } from './category.model'

export interface CreateCategoryDto {
  title: string
  description: string
  image: string // Base64 encoded image string
  parentCategory?: string // Parent Category ID
}

export interface UpdateCategoryDto {
  title?: string
  description?: string
  image?: string // Base64 encoded image string
  parentCategory?: string | null // Parent Category ID or null to clear
}


export class CategoryService {
  async create(dto: CreateCategoryDto) {
    // Check if category with same title already exists
    const existingCategory = await CategoryModel.findOne({
      title: dto.title,
    })

    if (existingCategory) {
      throw new Error('Category with this title already exists')
    }

    // Validate parentCategory if provided
    if (dto.parentCategory) {
      const parentCategoryExists = await CategoryModel.findById(dto.parentCategory)
      if (!parentCategoryExists) {
        throw new Error('Parent category not found')
      }
    }

    const category = new CategoryModel({
      title: dto.title,
      description: dto.description,
      image: dto.image, // Base64 string (converted from file in controller)
      parentCategory: dto.parentCategory ? new mongoose.Types.ObjectId(dto.parentCategory) : null,
    })

    await category.save()
    return category.toObject()
  }

  async getAll() {
    const categories = await CategoryModel.find().sort({ createdAt: -1 })
    return categories.map((cat) => cat.toObject())
  }

  async getById(id: string) {
    const category = await CategoryModel.findById(id).populate('parentCategory', 'title _id')

    if (!category) {
      throw new Error('Category not found')
    }

    return category.toObject()
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await CategoryModel.findById(id)

    if (!category) {
      throw new Error('Category not found')
    }

    // Check if title is being updated and if it conflicts with existing category
    if (dto.title && dto.title !== category.title) {
      const existingCategory = await CategoryModel.findOne({
        title: dto.title,
        _id: { $ne: id },
      })

      if (existingCategory) {
        throw new Error('Category with this title already exists')
      }
    }

    // Validate parentCategory if provided
    if (dto.parentCategory !== undefined) {
      if (dto.parentCategory) {
        const parentCategoryExists = await CategoryModel.findById(dto.parentCategory)
        if (!parentCategoryExists) {
          throw new Error('Parent category not found')
        }
        // Prevent self-reference
        if (dto.parentCategory === id) {
          throw new Error('Category cannot be its own parent')
        }
        category.parentCategory = new mongoose.Types.ObjectId(dto.parentCategory)
      } else {
        category.parentCategory = null
      }
    }

    // Update fields
    if (dto.title) category.title = dto.title
    if (dto.description) category.description = dto.description
    if (dto.image) category.image = dto.image // Base64 string (converted from file in controller)

    await category.save()
    return category.toObject()
  }

  async delete(id: string) {
    const category = await CategoryModel.findById(id)

    if (!category) {
      throw new Error('Category not found')
    }

    // Hard delete
    await CategoryModel.findByIdAndDelete(id)

    return { message: 'Category deleted successfully' }
  }
}

