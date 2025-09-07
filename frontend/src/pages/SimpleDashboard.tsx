import React, { useState } from 'react'
import { Plus, Grid, List, Search, Palette } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Component, Category } from '@/types'
import { ComponentCard } from '@/components/dashboard/ComponentCard'
import { SearchBar } from '@/components/dashboard/SearchBar'
import { ViewToggle } from '@/components/dashboard/ViewToggle'
import { AppHeader } from '@/components/layout/AppHeader'
import { useNavigate } from 'react-router-dom'

export function SimpleDashboard() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Fetch user's components (authenticated required)
  const { data: components = [], isLoading: componentsLoading } = useQuery({
    queryKey: ['my-components', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      params.append('sortBy', 'updatedAt')
      params.append('sortOrder', 'desc')
      
      const response = await api.get(`/components?${params.toString()}`)
      return response.data.data || []
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="My Components" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Create Button */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              My Components ({components.length})
            </h1>
            <p className="text-gray-600">
              Manage your React components and share them with the community
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/visual-editor')}
              className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Palette className="w-4 h-4 mr-2" />
              Visual Editor
            </button>
            <button
              onClick={() => navigate('/create')}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Component
            </button>
            
          </div>
        </div>

        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search my components..."
            />
          </div>
          
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Components Grid/List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {componentsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your components...</p>
            </div>
          ) : components.length === 0 ? (
            <div className="p-8 text-center">
              <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No components match your search' : 'No components yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Get started by creating your first component'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/create')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Component
                </button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6'
                : 'divide-y divide-gray-200'
            }>
              {components.map((component: Component) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
