import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Eye, Code, Settings, AlertTriangle, Paintbrush, Layers } from 'lucide-react'
import { api } from '@/lib/api'
import { UpdateComponentForm, Category, Component } from '@/types'
import { ComponentEditor } from '../components/editor/ComponentEditor'
import { ComponentPreview } from '../components/editor/ComponentPreview'
import { EditComponentMetadata } from '../components/editor/EditComponentMetadata'
import { VisualComponentBuilder } from '../components/visual-editor/VisualComponentBuilder'
import { ComponentState } from '../components/visual-editor/types'

const updateComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean(),
  isTemplate: z.boolean(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  categoryId: z.string().optional(),
  // Version-specific fields
  jsxCode: z.string().min(1, 'JSX code is required'),
  cssCode: z.string().optional(),
  dependencies: z.record(z.string()).optional(),
  changelog: z.string().optional(),
  versionType: z.enum(['patch', 'minor', 'major']),
})

export function EditComponentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'preview' | 'metadata'>('visual')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Fetch component details
  const { data: component, isLoading: componentLoading, error } = useQuery({
    queryKey: ['component', id],
    queryFn: async () => {
      if (!id) throw new Error('Component ID is required')
      const response = await api.get(`/components/${id}`)
      return response.data.data as Component
    },
    enabled: !!id,
  })

  const form = useForm<UpdateComponentForm & { jsxCode: string; cssCode?: string; dependencies?: Record<string, string>; changelog?: string; versionType: 'patch' | 'minor' | 'major' }>({
    resolver: zodResolver(updateComponentSchema),
    defaultValues: {
      versionType: 'patch'
    }
  })

  // Initialize form with component data
  useEffect(() => {
    if (component && component.versions?.[0]) {
      const latestVersion = component.versions[0]
      form.reset({
        name: component.name,
        description: component.description || '',
        isPublic: component.isPublic,
        isTemplate: component.isTemplate,
        tags: component.tags,
        categoryId: component.categoryId || '',
        jsxCode: latestVersion.jsxCode,
        cssCode: latestVersion.cssCode || '',
        dependencies: latestVersion.dependencies || { 'react': '^18.0.0' },
        changelog: '',
        versionType: 'patch'
      })
    }
  }, [component, form])

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true)
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data.data || []
    },
  })

  // Update component mutation
  const updateComponentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { jsxCode, cssCode, dependencies, changelog, versionType, ...componentData } = data
      
      // Update component metadata
      await api.put(`/components/${id}`, componentData)
      
      // Create new version
      const versionData = {
        jsxCode,
        cssCode,
        dependencies,
        changelog: changelog || `${versionType} update`
      }
      
      const response = await api.post(`/components/${id}/versions`, versionData)
      return response.data
    },
    onSuccess: (data) => {
      toast.success('Component updated successfully!')
      setHasUnsavedChanges(false)
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['component', id] })
      queryClient.invalidateQueries({ queryKey: ['components'] })
      // Navigate back to component detail
      navigate(`/components/${id}`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update component'
      toast.error(message)
    },
  })

  const handleSubmit = form.handleSubmit((data) => {
    updateComponentMutation.mutate(data)
  })

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/components/${id}`)
      }
    } else {
      navigate(`/components/${id}`)
    }
  }

  const handleSaveDraft = () => {
    // Save current state to localStorage as draft
    const currentValues = form.getValues()
    localStorage.setItem(`component-draft-${id}`, JSON.stringify(currentValues))
    toast.success('Draft saved locally')
  }

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`component-draft-${id}`)
    if (savedDraft && !component) {
      try {
        const draftData = JSON.parse(savedDraft)
        form.reset(draftData)
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [id, component, form])

  if (componentLoading) {
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
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Component Not Found</h2>
          <p className="text-gray-600 mb-4">The component you're trying to edit doesn't exist or you don't have permission.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Component
              </button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  Edit: {component.name}
                </h1>
                <p className="text-sm text-gray-500">
                  Current version: v{component.versions?.[0]?.version || '1.0.0'} → New {form.watch('versionType')} version
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <div className="flex items-center text-sm text-orange-600">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mr-2"></div>
                  Unsaved changes
                </div>
              )}
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateComponentMutation.isPending}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateComponentMutation.isPending ? (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Update Component
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'visual'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Paintbrush className="w-4 h-4 mr-2" />
              Visual Editor
              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                Primary
              </span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'code'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Code className="w-4 h-4 mr-2" />
              Source Code
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'metadata'
                  ? 'bg-white text-gray-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Tab Content */}
          {activeTab === 'visual' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Paintbrush className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Visual Component Editor</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Design your component visually with drag-and-drop. No coding required!
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-screen">
                <VisualComponentBuilder
                  onSave={(componentState) => {
                    // Convert visual component to JSX code
                    // This would need to be implemented to convert the visual state to code
                    toast.success('Visual changes saved!')
                    setHasUnsavedChanges(true)
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Code className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Source Code Editor</h3>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Edit the raw JSX and CSS code directly. For advanced users.
                </p>
              </div>
              <ComponentEditor
                jsxCode={form.watch('jsxCode') || ''}
                cssCode={form.watch('cssCode') || ''}
                language={component.language}
                onJsxCodeChange={(code) => form.setValue('jsxCode', code)}
                onCssCodeChange={(code) => form.setValue('cssCode', code)}
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Component Preview</h3>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  See how your component will look when rendered.
                </p>
              </div>
              <ComponentPreview
                jsxCode={form.watch('jsxCode') || ''}
                cssCode={form.watch('cssCode') || ''}
                dependencies={form.watch('dependencies') || {}}
              />
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Component Settings</h3>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  Configure component metadata, version, and publishing options.
                </p>
              </div>
              <EditComponentMetadata
                form={form}
                categories={categories}
                component={component}
                isLoading={updateComponentMutation.isPending}
              />
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
