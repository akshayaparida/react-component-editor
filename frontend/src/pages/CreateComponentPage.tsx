import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Copy, Download, Code, Palette } from 'lucide-react'
import { api } from '@/lib/api'
import { ComponentEditor } from '@/components/editor/ComponentEditor'
import { ComponentPreview } from '@/components/editor/ComponentPreview'
import Editor from '@monaco-editor/react'

export function CreateComponentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // State
  const [name, setName] = useState('')
  const [jsxCode, setJsxCode] = useState(`import React, { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Hello Component
      </h1>
      <p className="text-gray-600 mb-4">
        Count: {count}
      </p>
      <button 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setCount(c => c + 1)}
      >
        Click me!
      </button>
    </div>
  );
}`)
  const [cssCode, setCssCode] = useState('')
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const [keepPropertiesOpen, setKeepPropertiesOpen] = useState(false)
  const [textInputValue, setTextInputValue] = useState('')
  const [textChangePending, setTextChangePending] = useState(false)
  const textInputTimeoutRef = useRef<NodeJS.Timeout | null>(null)


  // Save mutation with enhanced logging
  const createComponentMutation = useMutation({
    mutationFn: async () => {
      const componentName = name.trim() || 'MyComponent'
      const slug = componentName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()
      
      const payload = {
        name: componentName,
        slug,
        version: '1.0.0',
        jsxCode,
        cssCode: cssCode || '',
        framework: 'react',
        language: 'typescript',
        isPublic: false,
        isTemplate: false,
        tags: [],
        dependencies: { react: '^18.0.0' }
      }
      
      console.log('[CreateComponentPage] 🚀 Starting save operation:', {
        componentName,
        slug,
        jsxCodeLength: jsxCode.length,
        cssCodeLength: cssCode.length,
        hasSelectedElement: !!selectedElement
      })
      
      console.log('[CreateComponentPage] 📄 JSX Code being saved:', jsxCode)
      
      const response = await api.post('/components', payload)
      console.log('[CreateComponentPage] ✅ Save response:', response.data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('[CreateComponentPage] 🎉 Save successful:', data)
      toast.success('Component saved successfully!')
      queryClient.invalidateQueries({ queryKey: ['components'] })
      queryClient.invalidateQueries({ queryKey: ['my-components'] })
      // Stay in editor instead of redirecting
    },
    onError: (error: any) => {
      console.error('[CreateComponentPage] ❌ Save failed:', error)
      console.error('[CreateComponentPage] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      const message = error.response?.data?.message || error.message || 'Failed to save component'
      toast.error(`Save failed: ${message}`)
    }
  })


  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(jsxCode)
      toast.success('Code copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy code')
    }
  }

  // DIRECT APPROACH: Handle property changes with immediate DOM + JSX updates
  const handlePropertyChange = (
    property: string,
    value: string,
    updateType: 'style' | 'text' | 'attribute' = 'style'
  ) => {
    console.log('🎯 [DIRECT] Property change:', { property, value, updateType, hasElement: !!selectedElement })
    
    if (!selectedElement) {
      console.warn('No selected element')
      return
    }
    
    // For text content, skip DOM updates to prevent disconnection
    const element = selectedElement.element
    if (!element || !element.isConnected) {
      console.warn('Element not connected to DOM, proceeding with JSX update only')
      // Don't return - we can still update JSX
    }

    // 1. INSTANT DOM UPDATE (for visual feedback) - only if element is connected
    if (element && element.isConnected) {
      try {
        if (updateType === 'style') {
          if (property === 'color') {
            element.style.color = value
            console.log('✅ Applied color to DOM:', value)
          } else if (property === 'backgroundColor') {
            element.style.backgroundColor = value
            console.log('✅ Applied backgroundColor to DOM:', value)
          } else if (property === 'fontSize') {
            const sizeValue = value.includes('px') ? value : value + 'px'
            element.style.fontSize = sizeValue
            console.log('✅ Applied fontSize to DOM:', sizeValue)
          }
          
          // Flash visual feedback
          const originalBorder = element.style.border
          element.style.border = '2px solid #10b981'
          setTimeout(() => { element.style.border = originalBorder }, 300)
          
        } else if (updateType === 'text' && property === 'textContent') {
          // SKIP DOM text updates to prevent disconnection issues
          console.log('🔄 Skipping DOM text update to prevent disconnection')
        }
      } catch (domError) {
        console.warn('DOM update failed:', domError)
        // Don't return - continue with JSX update
      }
    } else {
      console.log('🔄 Skipping DOM update - element not connected')
    }

    // 2. UPDATE PROPERTIES PANEL STATE
    setSelectedElement((prev: any) => {
      if (!prev) return null
      
      // Use the provided value directly for text content or when element is disconnected
      const actualValue = (updateType === 'text' || !element || !element.isConnected)
        ? value
        : (updateType === 'style' ? getComputedStyle(element)[property as any] || value : value)
      
      return {
        ...prev,
        properties: {
          ...prev.properties,
          [property]: actualValue
        }
      }
    })

    // 3. DIRECT JSX MODIFICATION (the critical part!)
    setTimeout(() => {
      console.log('🔧 [DIRECT] Starting JSX modification for:', property, '=', value)
      
      let newJsxCode = jsxCode
      
      try {
        if (updateType === 'style') {
          // Direct JSX style modification - SIMPLE and RELIABLE
          const elementTag = selectedElement.tagName
          const finalValue = ['fontSize', 'padding', 'margin', 'borderRadius'].includes(property) && !value.includes('px') 
            ? value + 'px' 
            : value
          
          console.log(`📝 Modifying ${elementTag} ${property} to ${finalValue}`)
          
          // Strategy: Find the element and add/update style attribute
          if (elementTag === 'h1') {
            // Pattern: <h1 className="...">
            const h1Regex = /(<h1[^>]*)(>)/g
            const hasStyle = /style={{[^}]*}}/.test(jsxCode)
            
            if (hasStyle) {
              // Update existing style
              const styleRegex = new RegExp(`(style={{[^}]*${property}:\s*['"])[^'"]*(['"][^}]*}})`, 'g')
              if (jsxCode.match(styleRegex)) {
                newJsxCode = jsxCode.replace(styleRegex, `$1${finalValue}$2`)
                console.log('📝 Updated existing style property')
              } else {
                // Add property to existing style
                newJsxCode = jsxCode.replace(/(style={{[^}]*)(}})/g, `$1, ${property}: '${finalValue}'$2`)
                console.log('📝 Added property to existing style object')
              }
            } else {
              // Add new style attribute
              newJsxCode = jsxCode.replace(h1Regex, `$1 style={{${property}: '${finalValue}'}}$2`)
              console.log('📝 Added new style attribute')
            }
          }
          
          // Same pattern for other elements
          else if (elementTag === 'p') {
            const pRegex = /(<p[^>]*)(>)/g
            const hasStyle = /style={{[^}]*}}/.test(jsxCode)
            
            if (hasStyle) {
              const styleRegex = new RegExp(`(style={{[^}]*${property}:\s*['"])[^'"]*(['"][^}]*}})`, 'g')
              if (jsxCode.match(styleRegex)) {
                newJsxCode = jsxCode.replace(styleRegex, `$1${finalValue}$2`)
              } else {
                newJsxCode = jsxCode.replace(/(style={{[^}]*)(}})/g, `$1, ${property}: '${finalValue}'$2`)
              }
            } else {
              newJsxCode = jsxCode.replace(pRegex, `$1 style={{${property}: '${finalValue}'}}$2`)
            }
          }
          
          else if (elementTag === 'button') {
            const buttonRegex = /(<button[^>]*)(>)/g
            const hasStyle = /style={{[^}]*}}/.test(jsxCode)
            
            if (hasStyle) {
              const styleRegex = new RegExp(`(style={{[^}]*${property}:\s*['"])[^'"]*(['"][^}]*}})`, 'g')
              if (jsxCode.match(styleRegex)) {
                newJsxCode = jsxCode.replace(styleRegex, `$1${finalValue}$2`)
              } else {
                newJsxCode = jsxCode.replace(/(style={{[^}]*)(}})/g, `$1, ${property}: '${finalValue}'$2`)
              }
            } else {
              newJsxCode = jsxCode.replace(buttonRegex, `$1 style={{${property}: '${finalValue}'}}$2`)
            }
          }
        }
        
        else if (updateType === 'text' && property === 'textContent') {
          // Direct text content modification
          const elementTag = selectedElement.tagName
          
          if (elementTag === 'h1') {
            newJsxCode = jsxCode.replace(/(<h1[^>]*>)([^<]+)(<\/h1>)/g, `$1${value}$3`)
            console.log('📝 Updated h1 text content')
          } else if (elementTag === 'p') {
            newJsxCode = jsxCode.replace(/(<p[^>]*>)([^<{]+)(<\/p>)/g, `$1${value}$3`)
            console.log('📝 Updated p text content')
          } else if (elementTag === 'button') {
            newJsxCode = jsxCode.replace(/(<button[^>]*>)([^<{]+)(<\/button>)/g, `$1${value}$3`)
            console.log('📝 Updated button text content')
          }
        }
        
        // Apply the JSX changes if any were made
        if (newJsxCode !== jsxCode && newJsxCode.trim() !== '') {
          console.log('✅ [DIRECT] JSX code successfully modified!')
          console.log('Old JSX length:', jsxCode.length)
          console.log('New JSX length:', newJsxCode.length)
          setJsxCode(newJsxCode)
          
          // For text updates, refresh the element selection after a short delay
          if (updateType === 'text') {
            setTimeout(() => {
              console.log('🔄 Refreshing element selection after text update')
              // The ComponentPreview will handle re-selection automatically
            }, 200)
          }
        } else {
          console.warn('⚠️ [DIRECT] No JSX changes made - pattern may not have matched')
          console.log('JSX sample:', jsxCode.substring(0, 300))
        }
        
      } catch (jsxError) {
        console.error('❌ [DIRECT] JSX modification failed:', jsxError)
      }
    }, 100) // Short delay to ensure DOM is updated
  }

  // Debounced text change handler to prevent DOM disconnection on every keystroke
  const handleTextChange = useCallback((newValue: string) => {
    setTextInputValue(newValue)
    setTextChangePending(true)
    
    // Clear existing timeout
    if (textInputTimeoutRef.current) {
      clearTimeout(textInputTimeoutRef.current)
    }
    
    // Set new timeout to update after user stops typing
    textInputTimeoutRef.current = setTimeout(() => {
      console.log('📝 [DEBOUNCED] Applying text change:', newValue)
      handlePropertyChange('textContent', newValue, 'text')
      setTextChangePending(false)
    }, 300) // 300ms delay after user stops typing
  }, [selectedElement])
  
  // Update text input value when element selection changes
  useEffect(() => {
    if (selectedElement?.properties?.textContent) {
      setTextInputValue(selectedElement.properties.textContent)
      setTextChangePending(false) // Clear pending state when switching elements
    }
  }, [selectedElement])
  
  // Sync text input value when JSX code changes (to reflect updates from debounced changes)
  useEffect(() => {
    if (selectedElement?.tagName && selectedElement?.properties?.textContent) {
      const elementTag = selectedElement.tagName.toLowerCase()
      
      // Extract current text content from JSX code
      let currentTextInJSX = ''
      if (elementTag === 'h1') {
        const match = jsxCode.match(/<h1[^>]*>([^<]+)<\/h1>/)
        currentTextInJSX = match ? match[1].trim() : ''
      } else if (elementTag === 'p') {
        const match = jsxCode.match(/<p[^>]*>([^<{]+)<\/p>/)
        currentTextInJSX = match ? match[1].trim() : ''
      } else if (elementTag === 'button') {
        const match = jsxCode.match(/<button[^>]*>([^<{]+)<\/button>/)
        currentTextInJSX = match ? match[1].trim() : ''
      }
      
      // Only update if there's a difference and we're not currently typing
      if (currentTextInJSX && currentTextInJSX !== textInputValue && !textChangePending) {
        console.log('🔄 Syncing text input from JSX:', currentTextInJSX)
        setTextInputValue(currentTextInJSX)
        
        // Also update the selected element properties
        setSelectedElement(prev => prev ? {
          ...prev,
          properties: {
            ...prev.properties,
            textContent: currentTextInJSX
          }
        } : null)
      }
    }
  }, [jsxCode, selectedElement?.tagName, textChangePending])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (textInputTimeoutRef.current) {
        clearTimeout(textInputTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <div className="border-l border-gray-300 pl-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Component Name"
                  className="text-xl font-semibold text-gray-900 bg-transparent border-none outline-none focus:bg-gray-50 rounded px-2 py-1"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={copyCode}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </button>
              
              <button
                onClick={() => createComponentMutation.mutate()}
                disabled={createComponentMutation.isPending}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createComponentMutation.isPending ? (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* Left: Preview */}
          <div className="flex-1">
            <ComponentPreview
              jsxCode={jsxCode}
              cssCode={cssCode}
              dependencies={{ react: '^18.0.0' }}
              onElementSelected={(element) => {
                console.log('🎯 Element selected:', element)
                setSelectedElement(element)
                if (element) {
                  setKeepPropertiesOpen(true) // Keep properties panel open
                }
              }}
            />
          </div>

          {/* Right: Code Editor or Properties Panel */}
          <div className="w-1/2">
            {(selectedElement || keepPropertiesOpen) ? (
              // Properties Panel
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-900">Element Properties</h3>
                    {keepPropertiesOpen && !selectedElement && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Sticky Mode
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedElement(null)
                      setKeepPropertiesOpen(false)
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
                
                <div className="p-4 overflow-auto h-full">
                  {selectedElement ? (
                    <>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                          Text Content
                          {textChangePending && (
                            <span className="ml-2 text-xs text-amber-600 flex items-center">
                              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse mr-1" />
                              Saving...
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={textInputValue}
                          onChange={(e) => {
                            handleTextChange(e.target.value)
                          }}
                          placeholder={selectedElement.properties.textContent || 'Enter text content'}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            textChangePending 
                              ? 'border-amber-300 bg-amber-50' 
                              : 'border-gray-300'
                          }`}
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
                          value={selectedElement.properties.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#ffffff' : (selectedElement.properties.backgroundColorHex || selectedElement.properties.backgroundColor)}
                          onChange={(e) => {
                            console.log('[CreateComponentPage] Background color picker changed:', e.target.value)
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
                          value={selectedElement.properties.colorHex || selectedElement.properties.color}
                          onChange={(e) => {
                            console.log('[CreateComponentPage] Color picker changed:', e.target.value)
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
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePropertyChange('color', '#ff0000', 'style')}
                          className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                        >
                          Test Red Color
                        </button>
                        <button
                          onClick={() => handlePropertyChange('color', '#00ff00', 'style')}
                          className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          Test Green Color
                        </button>
                        <button
                          onClick={() => handlePropertyChange('textContent', 'TEST TEXT', 'text')}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        >
                          Test Text Change
                        </button>
                      </div>
                      <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-auto max-h-40">
                        {JSON.stringify(selectedElement.properties, null, 2)}
                      </pre>
                    </div>
                  </details>
                    </>
                  ) : (
                    // No element selected but properties panel should stay open
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Palette className="w-12 h-12 text-gray-400 mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Element Selected</h4>
                      <p className="text-gray-600 mb-4">
                        Click on any element in the preview to edit its properties.
                      </p>
                      <p className="text-sm text-gray-500">
                        The properties panel will stay open while you edit the code.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Code Editor (default)
              <ComponentEditor
                jsxCode={jsxCode}
                cssCode={cssCode}
                language="typescript"
                onJsxCodeChange={setJsxCode}
                onCssCodeChange={setCssCode}
              />
            )}
          </div>
        </div>
      </div>


    </div>
  )
}
