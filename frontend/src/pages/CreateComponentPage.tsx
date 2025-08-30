import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Eye, Code, Settings, Paintbrush } from 'lucide-react'
import { api } from '@/lib/api'
import { CreateComponentForm, Category } from '@/types'
import { ComponentEditor } from '@/components/editor/ComponentEditor'
import { ComponentPreview } from '@/components/editor/ComponentPreview'
import { ComponentMetadata } from '@/components/editor/ComponentMetadata'
import { VisualComponentBuilder } from '@/components/visual-editor/VisualComponentBuilder'
import { ComponentState } from '@/components/visual-editor/types'

const createComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean(),
  isTemplate: z.boolean(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  framework: z.enum(['react', 'vue', 'angular', 'svelte']),
  language: z.enum(['typescript', 'javascript']),
  categoryId: z.string().optional(),
  version: z.string().min(1, 'Version is required'),
  jsxCode: z.string().min(1, 'JSX code is required'),
  cssCode: z.string().optional(),
  dependencies: z.record(z.string()).optional(),
  changelog: z.string().optional(),
})

export function CreateComponentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'preview' | 'metadata'>('visual')

  const form = useForm<CreateComponentForm>({
    resolver: zodResolver(createComponentSchema),
    defaultValues: {
      name: '',
      description: '',
      isPublic: true,
      isTemplate: false,
      tags: [],
      framework: 'react',
      language: 'typescript',
      version: '1.0.0',
      jsxCode: `import React from 'react'

interface Props {
  children: React.ReactNode
  className?: string
}

export default function MyComponent({ children, className = '' }: Props) {
  return (
    <div className={\`my-component \${className}\`}>
      {children}
    </div>
  )
}`,
      cssCode: `.my-component {
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
}`,
      dependencies: {
        'react': '^18.0.0'
      },
      changelog: 'Initial version'
    }
  })

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data.data || []
    },
  })

  const createComponentMutation = useMutation({
    mutationFn: async (data: CreateComponentForm) => {
      const response = await api.post('/components', data)
      return response.data
    },
    onSuccess: (data) => {
      toast.success('Component created successfully!')
      // Invalidate component-related queries to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ['components'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      navigate(`/components/${data.data.id}`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create component'
      toast.error(message)
    },
  })

  const handleSubmit = form.handleSubmit((data) => {
    // Generate slug from name if not provided
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    createComponentMutation.mutate({ ...data, slug })
  })

  const handleBack = () => {
    navigate('/')
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
                Back to Dashboard
              </button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  Create New Component
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => form.reset()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reset
              </button>
              <button
                onClick={handleSubmit}
                disabled={createComponentMutation.isPending}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createComponentMutation.isPending ? (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Create Component
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
              Visual Builder
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
              Component Info
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
                    <h2 className="text-xl font-semibold text-gray-900">Visual Component Builder</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Create your component visually with drag-and-drop. No coding required!
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-screen">
                <VisualComponentBuilder
                  onSave={(componentState) => {
                    // Convert visual component to JSX code and update form
                    // This would need proper implementation to convert visual state to code
                    toast.success('Component designed visually!')
                    // Auto-fill the component name if not set
                    if (!form.watch('name')) {
                      form.setValue('name', componentState.name || 'My Component')
                    }
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
                  Write JSX and CSS code directly. For developers and advanced users.
                </p>
              </div>
              <ComponentEditor
                jsxCode={form.watch('jsxCode')}
                cssCode={form.watch('cssCode') || ''}
                language={form.watch('language')}
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
                  Preview how your component will look when rendered.
                </p>
              </div>
              <ComponentPreview
                jsxCode={form.watch('jsxCode')}
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
                  <h3 className="font-medium text-gray-900">Component Information</h3>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  Configure component metadata, framework, and publishing settings.
                </p>
              </div>
              <ComponentMetadata
                form={form}
                categories={categories}
                isLoading={createComponentMutation.isPending}
              />
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
