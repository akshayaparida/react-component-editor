import React from 'react'
import { Calendar, User, Eye, Edit3, Star, Code } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Component } from '@/types'

interface ComponentCardProps {
  component: Component
  viewMode: 'grid' | 'list'
}

export function ComponentCard({ component, viewMode }: ComponentCardProps) {
  const navigate = useNavigate()

  const handleView = () => {
    navigate(`/components/${component.id}`)
  }

  const handleEdit = () => {
    navigate(`/components/${component.id}/edit`)
  }

  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {component.name}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                v{component.versions?.[0]?.version || '1.0.0'}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">
              {component.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
              <span className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {component.author?.name || 'Unknown'}
              </span>
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(component.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleView}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleEdit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {component.name}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              v{component.versions?.[0]?.version || '1.0.0'}
            </span>
          </div>
        </div>
        <button className="p-1 text-gray-400 hover:text-yellow-500 transition-colors">
          <Star className="w-4 h-4" />
        </button>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {component.description}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
        <span className="flex items-center">
          <User className="w-3 h-3 mr-1" />
          {component.author?.name || 'Unknown'}
        </span>
        <span className="flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {new Date(component.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {component.category && (
        <div className="mb-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {component.category.name}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={handleView}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </button>
          <button
            onClick={handleEdit}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </button>
        </div>
        <div className="text-xs text-gray-400">
          {component.isPublic ? 'Public' : 'Private'}
        </div>
      </div>
    </div>
  )
}
