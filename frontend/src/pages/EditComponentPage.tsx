import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Eye, Code, Copy, AlertTriangle, Edit, ChevronDown, GitBranch, Clock, Palette } from 'lucide-react'
import { api } from '@/lib/api'
import { updateJSXProperty } from '@/utils/jsxParser'
import { Component } from '@/types'
import { ComponentEditor } from '../components/editor/ComponentEditor'
import { ComponentPreview } from '../components/editor/ComponentPreview'
import { VisualEditor } from '../components/editor/VisualEditor'



export function EditComponentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // Always in edit mode - no view mode needed
  const [jsxCode, setJsxCode] = useState('')
  const [cssCode, setCssCode] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [showVersionDropdown, setShowVersionDropdown] = useState(false)
  const [editorMode, setEditorMode] = useState<'code' | 'visual' | 'split'>('split')
  const [selectedElement, setSelectedElement] = useState<any>(null)

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

  // Get current version (selected or latest)
  const getCurrentVersion = () => {
    if (!component?.versions) return null
    
    if (selectedVersionId) {
      return component.versions.find(v => v.id === selectedVersionId) || component.versions[0]
    }
    
    return component.versions[0] // Latest version
  }
  
  const currentVersion = getCurrentVersion()

  // Initialize code from component data
  useEffect(() => {
    if (currentVersion) {
      setJsxCode(currentVersion.jsxCode)
      setCssCode(currentVersion.cssCode || '')
      setHasChanges(false) // Reset changes when switching versions
    }
  }, [currentVersion])
  
  // Handle version selection
  const handleVersionChange = (versionId: string) => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Switching versions will lose your changes. Continue?'
      )
      if (!confirmed) return
    }
    
    setSelectedVersionId(versionId)
    setShowVersionDropdown(false)
    setHasChanges(false)
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showVersionDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('.version-dropdown')) {
          setShowVersionDropdown(false)
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showVersionDropdown])

  // Copy to clipboard functions
  const copyJSXCode = async () => {
    try {
      await navigator.clipboard.writeText(jsxCode)
      toast.success('JSX code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy JSX code')
    }
  }

  const copyCSSCode = async () => {
    try {
      await navigator.clipboard.writeText(cssCode)
      toast.success('CSS code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy CSS code')
    }
  }

  // Save mutation - create new version with updated code
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!component?.versions?.[0]) {
        throw new Error('No existing version found')
      }

      const currentVersion = component.versions[0]
      
      // Generate next version number (increment patch version)
      const versionParts = currentVersion.version.split('.').map(Number)
      versionParts[2] += 1 // Increment patch version
      const nextVersion = versionParts.join('.')

      // Create new version with updated code
      const versionData = {
        version: nextVersion,
        jsxCode,
        cssCode: cssCode || '',
        dependencies: currentVersion.dependencies || {},
        changelog: 'Updated component code',
        isStable: false, // Mark as unstable initially
      }
      
      const response = await api.post(`/components/${id}/versions`, versionData)
      return response.data
    },
    onSuccess: () => {
      toast.success('Component updated successfully!')
      setHasChanges(false)
      queryClient.invalidateQueries({ queryKey: ['component', id] })
      queryClient.invalidateQueries({ queryKey: ['components'] })
    },
    onError: (error: any) => {
      console.error('Save error:', error)
      const message = error.response?.data?.message || 'Failed to save component'
      toast.error(message)
    },
  })

  const handleSave = () => {
    saveMutation.mutate()
  }

  const handleCancelEdit = () => {
    setHasChanges(false)
    // Reset to original values
    if (component && component.versions?.[0]) {
      const latestVersion = component.versions[0]
      setJsxCode(latestVersion.jsxCode)
      setCssCode(latestVersion.cssCode || '')
    }
  }

  const handleJsxChange = (code: string) => {
    setJsxCode(code)
    setHasChanges(true)
  }

  const handleCssChange = (code: string) => {
    setCssCode(code)
    setHasChanges(true)
  }

  const handleBack = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/components/${id}`)
      }
    } else {
      navigate(`/components/${id}`)
    }
  }

  // Handle property changes using production-level service
  const handlePropertyChange = async (
    property: string,
    value: string,
    updateType: 'style' | 'text' | 'attribute' = 'style'
  ) => {
    if (!selectedElement) {
      console.warn('[EditComponentPage] No selected element for property change')
      return
    }
    
    // Import services dynamically to avoid circular dependencies
    const { propertyUpdateService } = await import('@/services/property-update.service')
    const { LoggingService } = await import('@/services/logging.service')
    
    try {
      const result = await propertyUpdateService.updateProperty(
        selectedElement,
        property as any,
        value,
        jsxCode,
        handleJsxChange
      )
      
      if (result.success) {
        // Update UI panel state with actual computed values
        setSelectedElement((prev: any) => {
          if (!prev) return null
          
          return {
            ...prev,
            properties: {
              ...prev.properties,
              [property]: result.actualValue || value
            }
          }
        })
        
        LoggingService.info('user_interaction', 'Property updated successfully', {
          property,
          value: result.actualValue,
          element: selectedElement.tagName
        })
      } else {
        LoggingService.error('user_interaction', 'Property update failed', undefined, {
          property,
          value,
          error: result.error,
          element: selectedElement.tagName
        })
        
        // Show user-friendly error message
        console.error(`Failed to update ${property}:`, result.error?.message)
      }
      
    } catch (error) {
      LoggingService.error('user_interaction', 'Unexpected error in property update', error as Error, {
        property,
        value,
        element: selectedElement.tagName
      })
      
      console.error('Unexpected error updating property:', error)
    }
  }

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
                <div className="flex items-center space-x-4">
                  {/* Version Selector */}
                  <div className="relative version-dropdown">
                    <button
                      onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                      className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <GitBranch className="w-4 h-4 mr-2" />
                      v{currentVersion?.version || '1.0.0'}
                      {currentVersion?.isLatest && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                          Latest
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </button>
                    
                    {/* Version Dropdown */}
                    {showVersionDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                        <div className="py-1">
                          <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
                            Select Version to Edit
                          </div>
                          {component?.versions?.map((version) => (
                            <button
                              key={version.id}
                              onClick={() => handleVersionChange(version.id)}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                                currentVersion?.id === version.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">v{version.version}</span>
                                  {version.isLatest && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Latest
                                    </span>
                                  )}
                                  {version.isStable && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      Stable
                                    </span>
                                  )}
                                </div>
                                <Clock className="w-3 h-3 text-gray-400" />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {version.changelog || 'No changelog'}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(version.createdAt).toLocaleDateString()}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Editor Mode Tabs */}
                    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setEditorMode('code')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          editorMode === 'code' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Code className="w-3 h-3 mr-1 inline" />
                        Code
                      </button>
                      <button
                        onClick={() => setEditorMode('visual')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          editorMode === 'visual' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Eye className="w-3 h-3 mr-1 inline" />
                        Visual
                      </button>
                      <button
                        onClick={() => setEditorMode('split')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          editorMode === 'split' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Edit className="w-3 h-3 mr-1 inline" />
                        Split
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {hasChanges && <span className="text-orange-600">• Unsaved changes</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reset Changes
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending || !hasChanges}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Code Editor Mode */}
        {editorMode === 'code' && (
          <div className="h-[calc(100vh-12rem)]">
            <ComponentEditor
              jsxCode={jsxCode}
              cssCode={cssCode}
              language={component.language}
              onJsxCodeChange={handleJsxChange}
              onCssCodeChange={handleCssChange}
            />
          </div>
        )}

        {/* Visual Editor Mode */}
        {editorMode === 'visual' && (
          <div className="h-[calc(100vh-12rem)]">
            <VisualEditor
              jsxCode={jsxCode}
              cssCode={cssCode}
              dependencies={component?.versions?.[0]?.dependencies || {}}
              onJsxCodeChange={handleJsxChange}
            />
          </div>
        )}

        {/* Split Mode - Original Layout */}
        {editorMode === 'split' && (
          <div className="flex gap-6 h-[calc(100vh-12rem)]">
            {/* Left: Preview */}
            <div className="flex-1">
              <ComponentPreview
                jsxCode={jsxCode}
                cssCode={cssCode}
                dependencies={component?.versions?.[0]?.dependencies || {}}
                onElementSelected={setSelectedElement}
              />
            </div>

            {/* Right: Code Editor or Properties Panel */}
            <div className="w-1/2">
              {selectedElement ? (
                // Properties Panel
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Palette className="w-4 h-4 text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-900">Element Properties</h3>
                    </div>
                    <button
                      onClick={() => setSelectedElement(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="p-4 overflow-auto h-full">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <Code className="w-4 h-4 mr-2" />
                      {selectedElement.tagName} Element
                    </h4>
                    
                    {/* Element info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded text-xs">
                      <div className="text-gray-600 mb-1">Path:</div>
                      <div className="font-mono text-gray-900">{selectedElement.path}</div>
                    </div>

                    {/* Basic properties */}
                    <div className="space-y-4">
                      {selectedElement.properties.textContent && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Content
                          </label>
                          <input
                            type="text"
                            value={selectedElement.properties.textContent}
                            onChange={(e) => {
                              handlePropertyChange('textContent', e.target.value, 'text')
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Color
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={selectedElement.properties.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#ffffff' : selectedElement.properties.backgroundColor}
                            onChange={(e) => {
                              handlePropertyChange('backgroundColor', e.target.value, 'style')
                            }}
                            className="w-16 h-10 rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            value={selectedElement.properties.backgroundColor}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            readOnly
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Text Color
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={selectedElement.properties.color}
                            onChange={(e) => {
                              handlePropertyChange('color', e.target.value, 'style')
                            }}
                            className="w-16 h-10 rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            value={selectedElement.properties.color}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            readOnly
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Size
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.fontSize}
                          onChange={(e) => {
                            handlePropertyChange('fontSize', e.target.value, 'style')
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Padding
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.padding}
                          onChange={(e) => {
                            handlePropertyChange('padding', e.target.value, 'style')
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Border Radius
                        </label>
                        <input
                          type="text"
                          value={selectedElement.properties.borderRadius}
                          onChange={(e) => {
                            handlePropertyChange('borderRadius', e.target.value, 'style')
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Debug info */}
                    <details className="mt-6">
                      <summary className="text-sm text-gray-500 cursor-pointer">Debug Info</summary>
                      <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-auto max-h-40">
                        {JSON.stringify(selectedElement.properties, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ) : (
                // Code Editor (default)
                <ComponentEditor
                  jsxCode={jsxCode}
                  cssCode={cssCode}
                  language={component.language}
                  onJsxCodeChange={handleJsxChange}
                  onCssCodeChange={handleCssChange}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
