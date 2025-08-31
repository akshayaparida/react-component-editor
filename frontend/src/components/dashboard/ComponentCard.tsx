import React, { useState } from 'react'
import { Calendar, User, Eye, Edit3, Star, Code, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Component } from '@/types'

interface ComponentCardProps {
  component: Component
  viewMode?: 'grid' | 'list'
  view?: 'grid' | 'list' // For backward compatibility
  showActions?: boolean
}

export function ComponentCard({ component, viewMode, view, showActions = true }: ComponentCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Use viewMode or fallback to view prop for backward compatibility
  const displayMode = viewMode || view || 'grid'

  const deleteComponentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/components/${id}`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Component deleted successfully!')
      
      // Invalidate ALL relevant queries to refresh everything
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['components'] })
        queryClient.invalidateQueries({ queryKey: ['my-components'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        queryClient.invalidateQueries({ queryKey: ['marketplace'] })
        queryClient.invalidateQueries({ queryKey: ['categories'] })
      }, 100) // Small delay to ensure smooth UI transition
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete component'
      toast.error(message)
    },
  })

  const handleView = () => {
    navigate(`/components/${component.id}`)
  }

  const handleEdit = () => {
    navigate(`/components/${component.id}/edit`)
  }

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteComponentMutation.mutate(component.id)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      // Reset confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  if (displayMode === 'list') {
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
        {showActions && (
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
            <button
              onClick={handleDelete}
              disabled={deleteComponentMutation.isPending}
              className={`p-2 rounded-md transition-colors ${
                showDeleteConfirm
                  ? 'text-red-600 bg-red-100 hover:bg-red-200'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-100'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
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
        {showActions ? (
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
            <button
              onClick={handleDelete}
              disabled={deleteComponentMutation.isPending}
              className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                showDeleteConfirm
                  ? 'text-red-700 bg-red-100 hover:bg-red-200'
                  : 'text-red-600 bg-red-50 hover:bg-red-100'
              }`}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {showDeleteConfirm ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleView}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </button>
          </div>
        )}
        <div className="text-xs text-gray-400">
          {component.isPublic ? 'Public' : 'Private'}
        </div>
      </div>
    </div>
  )
}
