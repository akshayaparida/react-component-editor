import React, { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { X, Plus, Tag, Info, Settings, Globe, Lock, GitBranch, Clock } from 'lucide-react'
import { UpdateComponentForm, Category, Component } from '../../types'

interface EditComponentMetadataProps {
  form: UseFormReturn<any>
  categories: Category[]
  component: Component
  isLoading: boolean
}

export function EditComponentMetadata({ form, categories, component, isLoading }: EditComponentMetadataProps) {
  const [newTag, setNewTag] = useState('')
  const { register, watch, setValue, formState: { errors } } = form

  const tags = watch('tags') || []
  const isPublic = watch('isPublic')
  const isTemplate = watch('isTemplate')
  const versionType = watch('versionType')

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

  // Calculate next version based on type
  const getNextVersion = (currentVersion: string, type: 'patch' | 'minor' | 'major') => {
    const parts = currentVersion.split('.').map(Number)
    if (parts.length !== 3) return '1.0.0'
    
    switch (type) {
      case 'major':
        return `${parts[0] + 1}.0.0`
      case 'minor':
        return `${parts[0]}.${parts[1] + 1}.0`
      case 'patch':
      default:
        return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
    }
  }

  const nextVersion = getNextVersion(component.currentVersion, versionType)

  return (
    <div className="space-y-8">
      {/* Version Information */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-blue-900">Version Update</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Current Version
            </label>
            <div className="bg-white px-3 py-2 border border-blue-300 rounded-md text-sm text-gray-900">
              v{component.currentVersion}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              New Version
            </label>
            <div className="bg-green-50 px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-900">
              v{nextVersion}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-blue-800 mb-3">
              Version Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  id="patch"
                  type="radio"
                  {...register('versionType')}
                  value="patch"
                  className="sr-only"
                />
                <label
                  htmlFor="patch"
                  className={`block w-full p-3 text-center text-sm font-medium border rounded-md cursor-pointer transition-colors ${
                    versionType === 'patch'
                      ? 'bg-green-100 border-green-500 text-green-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">Patch</div>
                  <div className="text-xs opacity-80">Bug fixes</div>
                </label>
              </div>
              
              <div>
                <input
                  id="minor"
                  type="radio"
                  {...register('versionType')}
                  value="minor"
                  className="sr-only"
                />
                <label
                  htmlFor="minor"
                  className={`block w-full p-3 text-center text-sm font-medium border rounded-md cursor-pointer transition-colors ${
                    versionType === 'minor'
                      ? 'bg-yellow-100 border-yellow-500 text-yellow-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">Minor</div>
                  <div className="text-xs opacity-80">New features</div>
                </label>
              </div>
              
              <div>
                <input
                  id="major"
                  type="radio"
                  {...register('versionType')}
                  value="major"
                  className="sr-only"
                />
                <label
                  htmlFor="major"
                  className={`block w-full p-3 text-center text-sm font-medium border rounded-md cursor-pointer transition-colors ${
                    versionType === 'major'
                      ? 'bg-red-100 border-red-500 text-red-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">Major</div>
                  <div className="text-xs opacity-80">Breaking changes</div>
                </label>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="changelog" className="block text-sm font-medium text-blue-800 mb-2">
              Changelog *
            </label>
            <textarea
              id="changelog"
              {...register('changelog')}
              rows={4}
              className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what changed in this version..."
            />
            <p className="text-xs text-blue-700 mt-1">
              Describe the changes made in this version for other developers
            </p>
            {errors.changelog && (
              <p className="mt-1 text-xs text-red-600">{errors.changelog.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Component Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Component Information</h3>
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

      {/* Current Component Stats */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Current Stats</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{component.viewCount}</div>
            <div className="text-sm text-gray-500">Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{component.likeCount}</div>
            <div className="text-sm text-gray-500">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{component.downloadCount}</div>
            <div className="text-sm text-gray-500">Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{component.versions?.length || 0}</div>
            <div className="text-sm text-gray-500">Versions</div>
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
    </div>
  )
}
