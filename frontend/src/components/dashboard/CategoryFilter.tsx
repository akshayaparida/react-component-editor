import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Category } from '../../types'

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onChange: (categoryId: string | null) => void
}

export function CategoryFilter({ categories, selectedCategory, onChange }: CategoryFilterProps) {
  return (
    <div className="relative">
      <select
        value={selectedCategory || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="appearance-none px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
}
