import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Eye, Code, Copy, AlertTriangle, Edit, Paintbrush, ChevronDown, GitBranch, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { Component } from '@/types'
import { ComponentEditor } from '../components/editor/ComponentEditor'
import { ComponentPreview } from '../components/editor/ComponentPreview'
import { VisualComponentBuilder } from '../components/visual-editor/VisualComponentBuilder'
import { ComponentState, ComponentElement } from '../components/visual-editor/types'

// Enhanced JSX parser to handle complex nested structures
function parseJSXToComponentState(jsxCode: string, cssCode: string, componentName?: string): ComponentState {
  try {
    console.log('🚀 Enhanced JSX Parser - Starting...')
    console.log('JSX Code:', jsxCode)
    console.log('CSS Code:', cssCode)
    
    const elements: ComponentElement[] = []
    
    // Extract the main JSX return statement
    const returnMatch = jsxCode.match(/return\s*\([\s\S]*?\)\s*[;}]/)
    if (!returnMatch) {
      console.warn('No return statement found, using full JSX')
    }
    
    const jsxContent = returnMatch ? returnMatch[0] : jsxCode
    console.log('Extracted JSX content:', jsxContent)
    
    // Enhanced regex to capture nested elements with better matching
    const elementRegex = /<(div|button|input|img|h[1-6]|p|span|label)[^>]*(?:\/>|>[\s\S]*?<\/\1>)/gs
    const elementMatches: Array<{ match: string; index: number; type: string; depth: number }> = []
    
    let match
    while ((match = elementRegex.exec(jsxContent)) !== null) {
      // Calculate nesting depth by counting opening tags before this match
      const beforeMatch = jsxContent.substring(0, match.index)
      const openTags = (beforeMatch.match(/<(?!\/)\w+/g) || []).length
      const closeTags = (beforeMatch.match(/<\/\w+>/g) || []).length
      const depth = openTags - closeTags
      
      elementMatches.push({
        match: match[0],
        index: match.index,
        type: match[1],
        depth: Math.max(0, depth)
      })
    }
    
    console.log('🔍 Found element matches:', elementMatches)
    
    // Sort by position to maintain original order
    elementMatches.sort((a, b) => a.index - b.index)
    
    // Process each element in order
    elementMatches.forEach((elementMatch, index) => {
      const { match: elementStr, type, depth } = elementMatch
      const styles = extractInlineStyles(elementStr)
      const attributes = extractAttributes(elementStr)
      
      console.log(`Processing ${type} element:`, { elementStr: elementStr.substring(0, 100), styles, attributes })
      
      switch (type) {
        case 'button':
          const buttonContent = extractTextContent(elementStr) || 'Button'
          elements.push({
            id: `button-${index}-${Date.now()}`,
            type: 'button',
            content: buttonContent.trim(),
            styles: {
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              ...styles
            },
            children: []
          })
          break
          
        case 'input':
          const inputType = attributes.type || 'text'
          const placeholder = attributes.placeholder || ''
          const required = attributes.hasOwnProperty('required')
          const disabled = attributes.hasOwnProperty('disabled')
          
          elements.push({
            id: `input-${index}-${Date.now()}`,
            type: 'input',
            content: '',
            placeholder: placeholder,
            inputType: inputType as any,
            required: required,
            disabled: disabled,
            styles: {
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              width: '100%',
              backgroundColor: '#ffffff',
              color: '#374151',
              ...styles
            },
            children: []
          })
          break
          
        case 'div':
          const divContent = extractTextContent(elementStr)
          const hasFlexDisplay = styles.display === 'flex' || elementStr.includes('display: \'flex\'') || elementStr.includes('display: "flex"')
          
          // Determine if it's a container or flex container
          const elementType = hasFlexDisplay ? 'flex' : 'container'
          
          elements.push({
            id: `${elementType}-${index}-${Date.now()}`,
            type: elementType as any,
            content: divContent && divContent.trim() ? divContent.trim() : '',
            styles: {
              padding: '16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              ...styles
            },
            children: []
          })
          break
          
        case 'img':
          const src = attributes.src || ''
          const alt = attributes.alt || ''
          elements.push({
            id: `image-${index}-${Date.now()}`,
            type: 'image',
            content: src,
            styles: {
              width: '200px',
              height: '150px',
              objectFit: 'cover',
              borderRadius: '8px',
              ...styles
            },
            children: []
          })
          break
          
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
        case 'p':
        case 'span':
        case 'label':
          const textContent = extractTextContent(elementStr) || `${type.toUpperCase()} text`
          elements.push({
            id: `text-${index}-${Date.now()}`,
            type: 'text',
            content: textContent.trim(),
            styles: {
              fontSize: type.startsWith('h') ? '18px' : '14px',
              fontWeight: type.startsWith('h') ? '600' : '400',
              color: '#374151',
              fontFamily: 'Inter, sans-serif',
              ...styles
            },
            children: []
          })
          break
          
        default:
          console.log(`Unhandled element type: ${type}`)
      }
    })
    
    // If no elements found, create a default one
    if (elements.length === 0) {
      elements.push({
        id: 'element-1',
        type: 'div',
        content: 'Component content',
        styles: {
          padding: '16px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '16px',
          color: '#374151',
          fontFamily: 'Inter, sans-serif'
        },
        children: []
      })
    }
    
    // Parse global styles from CSS
    const globalStyles = parseCSSGlobalStyles(cssCode)
    
    return {
      id: 'root',
      name: componentName || 'EditedComponent',
      elements,
      globalStyles
    }
    
  } catch (error) {
    console.warn('Failed to parse JSX to ComponentState:', error)
    // Return default state if parsing fails
    return {
      id: 'root',
      name: componentName || 'EditedComponent',
      elements: [{
        id: 'element-1',
        type: 'div',
        content: 'Click to edit text',
        styles: {
          padding: '16px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '16px',
          color: '#374151',
          fontFamily: 'Inter, sans-serif'
        },
        children: []
      }],
      globalStyles: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        lineHeight: '1.5'
      }
    }
  }
}

// Helper to extract attributes from JSX elements
function extractAttributes(jsxElement: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  
  // Match all attributes: name="value" or name='value' or name={value} or just name (boolean)
  const attrRegex = /(\w+)(?:=(["'])(.*?)\2|=\{([^}]*)\})?/g
  let match
  
  while ((match = attrRegex.exec(jsxElement)) !== null) {
    const [, name, , quotedValue, bracedValue] = match
    if (quotedValue !== undefined) {
      attributes[name] = quotedValue
    } else if (bracedValue !== undefined) {
      attributes[name] = bracedValue.replace(/["']/g, '')
    } else {
      // Boolean attribute (like required, disabled)
      attributes[name] = 'true'
    }
  }
  
  return attributes
}

// Helper to extract text content from JSX elements
function extractTextContent(jsxElement: string): string | null {
  // Handle self-closing tags
  if (jsxElement.includes('/>')) {
    return null
  }
  
  // Find content between opening and closing tags
  const contentMatch = jsxElement.match(/>([^<]*)</)
  if (contentMatch && contentMatch[1]) {
    return contentMatch[1].trim()
  }
  
  // Handle more complex content (might contain nested elements)
  const tagMatch = jsxElement.match(/<(\w+)[^>]*>([\s\S]*)<\/\1>/)
  if (tagMatch && tagMatch[2]) {
    const content = tagMatch[2].trim()
    // If content contains HTML tags, extract just the text
    if (content.includes('<')) {
      const textOnly = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      return textOnly || null
    }
    return content || null
  }
  
  return null
}

// Enhanced helper to extract inline styles from JSX elements
function extractInlineStyles(jsxElement: string): React.CSSProperties {
  const styles: React.CSSProperties = {}
  
  // Match style={{...}} pattern - handle nested braces better
  const styleMatch = jsxElement.match(/style=\{\{([^}]*(?:\}[^}]*)*?)\}\}/)
  if (styleMatch) {
    const styleString = styleMatch[1]
    console.log('Parsing styles:', styleString)
    
    // Split by comma, but handle nested objects and functions
    const properties = styleString.split(',')
    properties.forEach(prop => {
      const colonIndex = prop.indexOf(':')
      if (colonIndex > 0) {
        const key = prop.substring(0, colonIndex).trim()
        const value = prop.substring(colonIndex + 1).trim()
        
        if (key && value) {
          // Clean key: remove quotes and convert to camelCase
          const cleanKey = key.replace(/["']/g, '').replace(/-([a-z])/g, (g) => g[1].toUpperCase())
          // Clean value: remove quotes and handle different value types
          let cleanValue = value.replace(/["']/g, '')
          
          // Handle special cases
          if (cleanValue === 'true') cleanValue = true as any
          else if (cleanValue === 'false') cleanValue = false as any
          else if (/^\d+$/.test(cleanValue)) cleanValue = parseInt(cleanValue) as any
          
          styles[cleanKey as keyof React.CSSProperties] = cleanValue
        }
      }
    })
  }
  
  console.log('Extracted styles:', styles)
  return styles
}

// Helper to parse CSS for global styles
function parseCSSGlobalStyles(cssCode: string): React.CSSProperties {
  const globalStyles: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: '1.5'
  }
  
  try {
    // Look for common global CSS patterns
    if (cssCode.includes('font-family')) {
      const fontMatch = cssCode.match(/font-family:\s*([^;]+)/)
      if (fontMatch) {
        globalStyles.fontFamily = fontMatch[1].trim()
      }
    }
    
    if (cssCode.includes('font-size')) {
      const sizeMatch = cssCode.match(/font-size:\s*([^;]+)/)
      if (sizeMatch) {
        globalStyles.fontSize = sizeMatch[1].trim()
      }
    }
    
    if (cssCode.includes('line-height')) {
      const heightMatch = cssCode.match(/line-height:\s*([^;]+)/)
      if (heightMatch) {
        globalStyles.lineHeight = heightMatch[1].trim()
      }
    }
  } catch (error) {
    console.warn('Failed to parse CSS global styles:', error)
  }
  
  return globalStyles
}

// Helper functions for converting visual state to code (for saving from Visual Editor)
function generateJSXFromVisualState(componentState: ComponentState): string {
  const { name, elements } = componentState
  
  const generateElementJSX = (element: ComponentElement): string => {
    const { type, content, styles } = element
    const styleString = Object.entries(styles || {})
      .map(([key, value]) => `${key}: '${value}'`)
      .join(', ')
    
    switch (type) {
      case 'button':
        return `<button style={{${styleString}}}>${content}</button>`
      case 'input':
        return `<input placeholder="${content}" style={{${styleString}}} />`
      case 'image':
        return `<img src="${content}" alt="Component image" style={{${styleString}}} />`
      case 'text':
      case 'div':
      default:
        return `<div style={{${styleString}}}>${content}</div>`
    }
  }
  
  const elementsJSX = elements.map(generateElementJSX).join('\n    ')
  
  return `import React from 'react'

interface Props {
  className?: string
}

export default function ${name || 'MyComponent'}({ className = '' }: Props) {
  return (
    <div className={\`component-container \${className}\`}>
      ${elementsJSX}
    </div>
  )
}`
}

function generateCSSFromVisualState(componentState: ComponentState): string {
  const { globalStyles } = componentState
  
  let css = `.component-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}`
  
  if (globalStyles) {
    css += `\n\n.component-container * {
  font-family: ${globalStyles.fontFamily || 'Inter, sans-serif'};
  font-size: ${globalStyles.fontSize || '16px'};
  line-height: ${globalStyles.lineHeight || '1.5'};
}`
  }
  
  return css
}

export function EditComponentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'preview'>('visual')
  // Always in edit mode - no view mode needed
  const [jsxCode, setJsxCode] = useState('')
  const [cssCode, setCssCode] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [showVersionDropdown, setShowVersionDropdown] = useState(false)

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
                  
                  <div className="text-sm text-gray-500">
                    • Visual Editor Ready
                    {hasChanges && <span className="text-orange-600"> • Unsaved changes</span>}
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
          </nav>
        </div>

        <div className="space-y-6">
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
                      Design your component visually with drag-and-drop. Changes will be saved to code automatically.
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-screen">
                <VisualComponentBuilder
                  initialComponent={parseJSXToComponentState(jsxCode, cssCode, component.name)}
                  onSave={(componentState) => {
                    try {
                      console.log('Saving visual component state:', componentState)
                      
                      // Convert visual component to JSX/CSS code and update state
                      const generatedJSX = generateJSXFromVisualState(componentState)
                      const generatedCSS = generateCSSFromVisualState(componentState)
                      
                      console.log('Generated JSX:', generatedJSX)
                      console.log('Generated CSS:', generatedCSS)
                      
                      // Update the JSX and CSS code state
                      setJsxCode(generatedJSX)
                      setCssCode(generatedCSS)
                      setHasChanges(true)
                      
                      toast.success('Visual changes applied to code!')
                    } catch (error) {
                      console.error('Error converting visual state to code:', error)
                      toast.error('Failed to convert visual design to code')
                    }
                  }}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'code' && (
            <div className="space-y-4">
              {/* Always show ComponentEditor with inline copy buttons */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">Component Source Code</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Edit your component code directly or copy it to use in your project
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={copyJSXCode}
                      className="flex items-center px-3 py-1.5 text-sm text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-1.5" />
                      Copy JSX
                    </button>
                    {cssCode && (
                      <button
                        onClick={copyCSSCode}
                        className="flex items-center px-3 py-1.5 text-sm text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors"
                      >
                        <Copy className="w-4 h-4 mr-1.5" />
                        Copy CSS
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-0">
                  <ComponentEditor
                    jsxCode={jsxCode}
                    cssCode={cssCode}
                    language={component.language}
                    onJsxCodeChange={handleJsxChange}
                    onCssCodeChange={handleCssChange}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="bg-green-50 border-b border-green-200 px-6 py-4">
                <h3 className="text-lg font-medium text-green-900">Component Preview</h3>
                <p className="text-sm text-green-700 mt-1">
                  See how your component will look when rendered
                </p>
              </div>
              <div className="p-6">
                <ComponentPreview
                  jsxCode={jsxCode}
                  cssCode={cssCode}
                  dependencies={component?.versions?.[0]?.dependencies || {}}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
