import React, { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { X, Plus, Tag, Info, Settings, Globe, Lock } from 'lucide-react'
import { CreateComponentForm, Category } from '@/types'

interface ComponentMetadataProps {
  form: UseFormReturn<CreateComponentForm>
  categories: Category[]
  isLoading: boolean
}

export function ComponentMetadata({ form, categories, isLoading }: ComponentMetadataProps) {
  const [newTag, setNewTag] = useState('')
  const { register, watch, setValue, formState: { errors } } = form

  const tags = watch('tags') || []
  const isPublic = watch('isPublic')
  const isTemplate = watch('isTemplate')

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setValue('tags', [...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setValue('tags', tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Component Name *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter component name"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-2">
              Version *
            </label>
            <input
              id="version"
              type="text"
              {...register('version')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1.0.0"
            />
            {errors.version && (
              <p className="mt-1 text-xs text-red-600">{errors.version.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what this component does..."
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Technical Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-medium text-gray-900">Technical Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="framework" className="block text-sm font-medium text-gray-700 mb-2">
              Framework
            </label>
            <select
              id="framework"
              {...register('framework')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="react">React</option>
              <option value="vue">Vue</option>
              <option value="angular">Angular</option>
              <option value="svelte">Svelte</option>
            </select>
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              id="language"
              {...register('language')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="categoryId"
              {...register('categoryId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Tag className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900">Tags</h3>
          <span className="text-sm text-gray-500">({tags.length}/10)</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          
          {tags.length < 10 && (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a tag and press Enter"
                maxLength={30}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            Add relevant tags to help others discover your component. Maximum 10 tags.
          </p>
        </div>
      </div>

      {/* Visibility & Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Globe className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-medium text-gray-900">Visibility & Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <input
              id="isPublic"
              type="checkbox"
              {...register('isPublic')}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="isPublic" className="block text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-2">
                  {isPublic ? (
                    <Globe className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                  <span>Public Component</span>
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {isPublic 
                  ? 'This component will be visible to everyone and searchable in the public library'
                  : 'This component will be private and only visible to you'
                }
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              id="isTemplate"
              type="checkbox"
              {...register('isTemplate')}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="isTemplate" className="block text-sm font-medium text-gray-700">
                Template Component
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Mark this as a template that others can use as a starting point for their own components
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Changelog */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Changelog</h3>
        </div>
        
        <div>
          <label htmlFor="changelog" className="block text-sm font-medium text-gray-700 mb-2">
            Version Notes
          </label>
          <textarea
            id="changelog"
            {...register('changelog')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe changes in this version..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional notes about what's new or changed in this version
          </p>
        </div>
      </div>
    </div>
  )
}
