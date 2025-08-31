import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AppHeader } from '@/components/layout/AppHeader';
import { ComponentCard } from '@/components/dashboard/ComponentCard';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { CategoryFilter } from '@/components/dashboard/CategoryFilter';
import { ViewToggle } from '@/components/dashboard/ViewToggle';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface MarketplaceFilters {
  search: string;
  category: string;
  framework: string;
  language: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function MarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: '',
    category: '',
    framework: '',
    language: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data?.data || [];
    },
  });

  const {
    data: components = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['marketplace-components', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.framework) params.set('framework', filters.framework);
      if (filters.language) params.set('language', filters.language);
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);
      
      const response = await api.get(`/components/marketplace?${params.toString()}`);
      return response.data?.data || [];
    },
  });

  const handleFilterChange = useCallback((key: keyof MarketplaceFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Fork component mutation with proper loading states and cache invalidation
  const forkComponentMutation = useMutation({
    mutationFn: async (componentId: string) => {
      const response = await api.post(`/components/${componentId}/fork`, {})
      return response.data
    },
    onSuccess: (data) => {
      toast.success(`Component "${data.data.name}" forked successfully! Check your dashboard.`)
      
      // Invalidate ALL relevant queries to refresh everything
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['components'] })           // Legacy dashboard
        queryClient.invalidateQueries({ queryKey: ['my-components'] })        // New simplified dashboard
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })      // Dashboard stats
        queryClient.invalidateQueries({ queryKey: ['marketplace-components'] }) // Marketplace data
        queryClient.invalidateQueries({ queryKey: ['marketplace'] })          // Marketplace queries
        queryClient.invalidateQueries({ queryKey: ['categories'] })           // Category data
      }, 100) // Small delay for smooth UI transition
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to fork component'
      toast.error(message)
    },
  })

  const handleForkComponent = (componentId: string) => {
    forkComponentMutation.mutate(componentId)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Component Marketplace</h1>
              <p className="text-gray-600 mt-1">
                Discover and fork public components from the community
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <ViewToggle view={view} onViewChange={setView} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="lg:col-span-3">
              <SearchBar
                value={filters.search}
                onChange={(value) => handleFilterChange('search', value)}
                placeholder="Search marketplace components..."
              />
            </div>
            <div>
              <CategoryFilter
                categories={categories}
                selectedCategory={filters.category}
                onChange={(value) => handleFilterChange('category', value || '')}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={filters.framework}
              onChange={(e) => handleFilterChange('framework', e.target.value)}
              className="input"
            >
              <option value="">All Frameworks</option>
              <option value="react">React</option>
              <option value="vue">Vue</option>
              <option value="angular">Angular</option>
            </select>

            <select
              value={filters.language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
              className="input"
            >
              <option value="">All Languages</option>
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
            </select>

            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc');
              }}
              className="input"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="viewCount-desc">Most Viewed</option>
              <option value="downloadCount-desc">Most Downloaded</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading marketplace components...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load marketplace components</p>
            <button
              onClick={() => refetch()}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : components.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {filters.search || filters.category || filters.framework || filters.language
                ? 'No components match your filters'
                : 'No public components available yet'}
            </p>
            {(filters.search || filters.category || filters.framework || filters.language) && (
              <button
                onClick={() => setFilters({
                  search: '',
                  category: '',
                  framework: '',
                  language: '',
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                })}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 ${
            view === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {components.map((component: any) => (
              <div key={component.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative">
                {/* Component Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
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
                  {/* Fork button for others' components */}
                  {user && component.author.id !== user.id && (
                    <button
                      onClick={() => handleForkComponent(component.id)}
                      disabled={forkComponentMutation.isPending}
                      className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Fork this component"
                    >
                      {forkComponentMutation.isPending ? (
                        <>
                          <div className="w-3 h-3 mr-1 animate-spin rounded-full border border-white border-t-transparent"></div>
                          Forking...
                        </>
                      ) : (
                        'Fork'
                      )}
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {component.description || 'No description provided'}
                </p>

                {/* Author and Date */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    by {component.author?.name || component.author?.username || 'Unknown'}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(component.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Tags */}
                {component.tags && component.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {component.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                      {component.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{component.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/components/${component.id}`)}
                      className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {component.viewCount || 0}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Public
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
