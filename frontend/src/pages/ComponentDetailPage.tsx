import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Edit3, 
  Download, 
  Star, 
  Eye, 
  Calendar, 
  User, 
  Tag, 
  Code, 
  FileText,
  Copy,
  ExternalLink,
  Heart,
  GitBranch
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { Component } from '../types'
import { ComponentEditor } from '../components/editor/ComponentEditor'
import { ComponentPreview } from '../components/editor/ComponentPreview'

export function ComponentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'versions'>('preview')
  const [copied, setCopied] = useState(false)

  // Fetch component details
  const { data: component, isLoading, error } = useQuery({
    queryKey: ['component', id],
    queryFn: async () => {
      if (!id) throw new Error('Component ID is required')
      const response = await api.get(`/components/${id}`)
      return response.data.component as Component
    },
    enabled: !!id,
  })

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (!component?.versions?.[0]?.jsxCode) return
    
    try {
      await navigator.clipboard.writeText(component.versions[0].jsxCode)
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy code')
    }
  }

  // Like/unlike component
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/components/${id}/like`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Component liked!')
      // Refetch component data to update like count
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to like component'
      toast.error(message)
    },
  })

  const handleBack = () => {
    navigate('/')
  }

  const handleEdit = () => {
    navigate(`/components/${id}/edit`)
  }

  const handleDownload = () => {
    if (!component?.versions?.[0]) return
    
    const version = component.versions[0]
    const content = `// ${component.name} v${version.version}\n// ${component.description || ''}\n\n${version.jsxCode}\n\n/* CSS */\n${version.cssCode || ''}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${component.name.toLowerCase().replace(/\s+/g, '-')}.${component.language === 'typescript' ? 'tsx' : 'jsx'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Component downloaded!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !component) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Component Not Found</h2>
          <p className="text-gray-600 mb-4">The component you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const latestVersion = component.versions?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  {component.name}
                </h1>
                <p className="text-sm text-gray-500">v{component.currentVersion}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => likeMutation.mutate()}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Heart className="w-4 h-4 mr-2" />
                {component.likeCount}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'code'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Source Code
                </button>
                <button
                  onClick={() => setActiveTab('versions')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'versions'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Versions ({component.versions?.length || 0})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'preview' && latestVersion && (
              <ComponentPreview
                jsxCode={latestVersion.jsxCode}
                cssCode={latestVersion.cssCode || ''}
                dependencies={latestVersion.dependencies || {}}
              />
            )}

            {activeTab === 'code' && latestVersion && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Source Code</h3>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {copied ? (
                      <>
                        <Copy className="w-4 h-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
                
                <ComponentEditor
                  jsxCode={latestVersion.jsxCode}
                  cssCode={latestVersion.cssCode || ''}
                  language={component.language}
                  onJsxCodeChange={() => {}} // Read-only
                  onCssCodeChange={() => {}} // Read-only
                />
              </div>
            )}

            {activeTab === 'versions' && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Version History</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {component.versions?.map((version) => (
                    <div key={version.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              v{version.version}
                            </span>
                            {version.isLatest && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Latest
                              </span>
                            )}
                            {version.isStable && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Stable
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {version.changelog || 'No changelog provided'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Released {new Date(version.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          className="text-sm text-blue-600 hover:text-blue-800"
                          onClick={() => {/* Navigate to specific version */}}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Component Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
              <div className="space-y-4">
                {component.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{component.description}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Author</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {component.author?.name || component.author?.username}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Framework</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{component.framework}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Language</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{component.language}</p>
                </div>

                {component.category && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <span className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {component.category.name}
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(component.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(component.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {component.tags.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-900">Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {component.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Views</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{component.viewCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Likes</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{component.likeCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Downloads</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{component.downloadCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
