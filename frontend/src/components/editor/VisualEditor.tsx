import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { Eye, MousePointer, Settings, Code, Palette } from 'lucide-react'
import { updateJSXProperty } from '@/utils/jsxParser'
import { testJSXParser } from '@/utils/testJsxParser'

interface SelectedElement {
  element: HTMLElement
  path: string
  tagName: string
  properties: Record<string, any>
}

interface VisualEditorProps {
  jsxCode: string
  cssCode: string
  dependencies: Record<string, string>
  onJsxCodeChange: (code: string) => void
}

export function VisualEditor({ jsxCode, cssCode, dependencies, onJsxCodeChange }: VisualEditorProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [isSelectMode, setIsSelectMode] = useState(true)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const mountRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<ReactDOM.Root | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  // Track last selected element path for re-selection after re-render
  const lastSelectedPathRef = useRef<string | null>(null)
  // Debounce timer for background JSX sync
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debug selected element changes
  useEffect(() => {
    console.log('[VisualEditor] Selected element changed:', selectedElement)
  }, [selectedElement])

  // PRODUCTION: Instant visual updates via direct DOM manipulation - ENHANCED
  const handlePropertyChange = (
    property: string,
    value: string,
    updateType: 'style' | 'text' | 'attribute' = 'style'
  ) => {
    if (!selectedElement) {
      console.warn('[VisualEditor] No selected element for property change')
      return
    }
    
    console.log(`[VisualEditor] PROPERTY CHANGE: ${property} = ${value}`, {
      element: selectedElement.element,
      tagName: selectedElement.tagName,
      path: selectedElement.path,
      updateType
    })
    
    // 1. INSTANT visual update - manipulate DOM directly with validation
    const element = selectedElement.element
    if (!element || !element.isConnected) {
      console.error('[VisualEditor] Element is not connected to DOM - stale reference')
      return
    }
    
    try {
      if (updateType === 'style') {
        const oldValue = getComputedStyle(element)[property as any]
        
        if (property === 'color') {
          element.style.color = value
          console.log(`[VisualEditor] ✅ Color: ${oldValue} → ${value}`)
        } else if (property === 'backgroundColor') {
          element.style.backgroundColor = value
          console.log(`[VisualEditor] ✅ Background: ${oldValue} → ${value}`)
        } else if (property === 'fontSize') {
          const finalValue = value.includes('px') ? value : value + 'px'
          element.style.fontSize = finalValue
          console.log(`[VisualEditor] ✅ Font Size: ${oldValue} → ${finalValue}`)
        } else if (property === 'padding') {
          const finalValue = value.includes('px') ? value : value + 'px'
          element.style.padding = finalValue
          console.log(`[VisualEditor] ✅ Padding: ${oldValue} → ${finalValue}`)
          // Force layout recalculation
          element.offsetHeight
        } else if (property === 'borderRadius') {
          const finalValue = value.includes('px') ? value : value + 'px'
          element.style.borderRadius = finalValue
          console.log(`[VisualEditor] ✅ Border Radius: ${oldValue} → ${finalValue}`)
        } else {
          console.warn(`[VisualEditor] Unsupported style property: ${property}`)
        }
        
        // Verify the change was applied
        const newValue = getComputedStyle(element)[property as any]
        console.log(`[VisualEditor] Verification - Computed ${property}: ${newValue}`)
        
      } else if (updateType === 'text' && property === 'textContent') {
        const oldText = element.textContent
        element.textContent = value
        console.log(`[VisualEditor] ✅ Text: "${oldText}" → "${value}"`)
      }
      
      // Flash the element border briefly to show it was updated
      const originalBorder = element.style.border
      element.style.border = '2px solid #10b981'
      setTimeout(() => {
        element.style.border = originalBorder
      }, 200)
      
    } catch (error) {
      console.error('[VisualEditor] Error applying style:', error)
    }
    
    // 2. Update UI panel state immediately
    setSelectedElement(prev => {
      if (!prev) return null
      return {
        ...prev,
        properties: {
          ...prev.properties,
          [property]: value
        }
      }
    })
    
    // 3. Background sync to JSX code (non-blocking, debounced)
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }
    // Store the last selected path for re-selection after sync
    lastSelectedPathRef.current = selectedElement.path

    syncTimerRef.current = setTimeout(() => {
      try {
        const updatedJsxCode = updateJSXProperty(
          jsxCode,
          selectedElement.path,
          property,
          value,
          updateType
        )
        
        if (updatedJsxCode !== jsxCode) {
          console.log('[VisualEditor] 📝 Debounced sync to JSX code')
          onJsxCodeChange(updatedJsxCode)
        }
      } catch (error) {
        console.error('[VisualEditor] Background JSX sync failed:', error)
      }
    }, 600)
  }

  // Create selection overlay
  const createSelectionOverlay = () => {
    if (!overlayRef.current) {
      const overlay = document.createElement('div')
      overlay.style.position = 'absolute'
      overlay.style.pointerEvents = 'none'
      overlay.style.border = '2px solid #3b82f6'
      overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
      overlay.style.zIndex = '1000'
      overlay.style.display = 'none'
      overlay.style.borderRadius = '4px'
      overlay.innerHTML = `
        <div style="
          position: absolute; 
          top: -24px; 
          left: 0; 
          background: #3b82f6; 
          color: white; 
          padding: 2px 8px; 
          font-size: 12px; 
          border-radius: 4px 4px 0 0;
          font-family: monospace;
        "></div>
      `
      document.body.appendChild(overlay)
      overlayRef.current = overlay
    }
    return overlayRef.current
  }

  // Update overlay position
  const updateOverlayPosition = (element: HTMLElement) => {
    const overlay = overlayRef.current
    if (!overlay) return

    const rect = element.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    overlay.style.display = 'block'
    overlay.style.top = (rect.top + scrollTop) + 'px'
    overlay.style.left = (rect.left + scrollLeft) + 'px'
    overlay.style.width = rect.width + 'px'
    overlay.style.height = rect.height + 'px'
    
    // Update label
    const label = overlay.querySelector('div')
    if (label) {
      label.textContent = element.tagName.toLowerCase()
    }
  }

  // Hide overlay
  const hideOverlay = () => {
    if (overlayRef.current) {
      overlayRef.current.style.display = 'none'
    }
  }

  // Handle element hover
  const handleElementHover = (event: MouseEvent) => {
    console.log('[VisualEditor] Element hover:', event.target)
    
    if (!isSelectMode) {
      console.log('[VisualEditor] Select mode disabled for hover')
      return
    }
    
    const target = event.target as HTMLElement
    console.log('[VisualEditor] Hover target:', target.tagName)
    
    if (target && mountRef.current?.contains(target)) {
      console.log('[VisualEditor] Updating overlay position')
      event.stopPropagation()
      updateOverlayPosition(target)
    }
  }

  // Handle element click
  const handleElementClick = (event: MouseEvent) => {
    console.log('[VisualEditor] Element click event:', event.target)
    console.log('[VisualEditor] Select mode:', isSelectMode)
    
    if (!isSelectMode) {
      console.log('[VisualEditor] Select mode is disabled')
      return
    }
    
    event.preventDefault()
    event.stopPropagation()
    
    const target = event.target as HTMLElement
    console.log('[VisualEditor] Click target:', target, 'Tag:', target.tagName)
    console.log('[VisualEditor] Mount container:', mountRef.current)
    console.log('[VisualEditor] Contains target:', mountRef.current?.contains(target))
    
    if (target && mountRef.current?.contains(target)) {
      // Get element path and properties
      const tagName = target.tagName.toLowerCase()
      const path = getElementPath(target)
      const properties = extractElementProperties(target)
      
      console.log('[VisualEditor] Setting selected element:', { tagName, path, properties })
      
      setSelectedElement({
        element: target,
        path,
        tagName,
        properties
      })
      // Remember the selected path for re-selection after JSX sync
      lastSelectedPathRef.current = path
      
      console.log('[VisualEditor] Selected element state should update')
    } else {
      console.log('[VisualEditor] Target not in mount container or invalid')
    }
  }

  // Get element path (for future JSX updates)
  const getElementPath = (element: HTMLElement): string => {
    const path: string[] = []
    let current = element
    
    console.log('[VisualEditor] Building path for element:', element.tagName, element)
    
    while (current && current !== mountRef.current) {
      const parent = current.parentElement
      if (parent) {
        const siblings = Array.from(parent.children)
        const index = siblings.indexOf(current)
        const pathSegment = `${current.tagName.toLowerCase()}[${index}]`
        console.log('[VisualEditor] Adding path segment:', pathSegment)
        path.unshift(pathSegment)
      }
      current = parent!
    }
    
    const finalPath = path.join(' > ')
    console.log('[VisualEditor] Final element path:', finalPath)
    return finalPath
  }

  // Extract element properties
  const extractElementProperties = (element: HTMLElement): Record<string, any> => {
    const computedStyle = window.getComputedStyle(element)
    
    return {
      // Text content
      textContent: element.textContent || '',
      
      // Colors
      color: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      borderColor: computedStyle.borderColor,
      
      // Layout
      display: computedStyle.display,
      width: computedStyle.width,
      height: computedStyle.height,
      padding: computedStyle.padding,
      margin: computedStyle.margin,
      
      // Typography
      fontSize: computedStyle.fontSize,
      fontWeight: computedStyle.fontWeight,
      fontFamily: computedStyle.fontFamily,
      textAlign: computedStyle.textAlign,
      
      // Borders
      borderWidth: computedStyle.borderWidth,
      borderRadius: computedStyle.borderRadius,
      borderStyle: computedStyle.borderStyle,
      
      // Position
      position: computedStyle.position,
      top: computedStyle.top,
      left: computedStyle.left,
      right: computedStyle.right,
      bottom: computedStyle.bottom
    }
  }

  // Find element by path inside the mount container
  const findElementByPath = (container: HTMLElement, path: string): HTMLElement | null => {
    if (!path) return null
    const segments = path.split(' > ')
    let parent: Element | null = container
    for (const seg of segments) {
      const m = seg.match(/([a-zA-Z0-9]+)\[(\d+)\]/)
      if (!m || !parent) return null
      const index = parseInt(m[2], 10)
      const next = (parent as HTMLElement).children.item(index)
      if (!next) return null
      parent = next
    }
    return parent as HTMLElement
  }

  const reselectLastElement = () => {
    const path = lastSelectedPathRef.current
    const container = mountRef.current
    if (!path || !container) return
    const el = findElementByPath(container, path)
    if (el) {
      setSelectedElement({
        element: el,
        path,
        tagName: el.tagName.toLowerCase(),
        properties: extractElementProperties(el)
      })
    }
  }

  // Render component like ComponentPreview but with interaction
  useEffect(() => {
    console.log('[VisualEditor] Starting render, jsxCode length:', jsxCode.length)
    setPreviewError(null)
    setIsLoading(true)

    const container = mountRef.current
    if (!container) {
      setIsLoading(false)
      return
    }

    // If no code, show empty state
    if (!jsxCode || jsxCode.trim() === '') {
      container.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;">Paste your React component code to start visual editing</div>'
      setIsLoading(false)
      return
    }

    try {
      // Clean up previous render
      if (rootRef.current) {
        try { 
          rootRef.current.unmount() 
        } catch (e) {
          console.warn('Root unmount failed:', e)
        }
        rootRef.current = null
      }
      container.innerHTML = ''
      
      // Basic validation
      const hasExport = jsxCode.includes('export default') || 
                       jsxCode.includes('export function') || 
                       jsxCode.includes('export const') ||
                       jsxCode.includes('function ')
      
      if (!hasExport) {
        setPreviewError('Component must have an export or function declaration')
        setIsLoading(false)
        return
      }

      // Create component like in ComponentPreview
      const componentName = (
        jsxCode.match(/export\s+(?:default\s+)?(?:function\s+)?(\w+)/) ||
        jsxCode.match(/function\s+(\w+)/) ||
        jsxCode.match(/const\s+(\w+)\s*=/) ||
        ['', 'Component']
      )[1]
      
      // Analyze code content
      const hasButton = jsxCode.toLowerCase().includes('button')
      const hasInput = jsxCode.toLowerCase().includes('input')
      const hasCounter = jsxCode.toLowerCase().includes('count')
      
      // Create mock component (same logic as ComponentPreview)
      let Component: React.ComponentType<any>
      
      if (hasCounter && hasButton) {
        Component = () => {
          const [count, setCount] = React.useState(0)
          return (
            <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '400px', margin: '0 auto', border: '2px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
              <h2 style={{ color: '#333', marginBottom: '16px' }}>{componentName}</h2>
              <p style={{ fontSize: '18px', marginBottom: '16px' }}>Count: {count}</p>
              <button 
                onClick={() => setCount(count + 1)}
                style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
              >
                Increment
              </button>
              <button 
                onClick={() => setCount(0)}
                style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>
          )
        }
      } else {
        Component = () => (
          <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '400px', margin: '0 auto', border: '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>{componentName}</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>This is your component in visual editor mode.</p>
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
              <small style={{ color: '#64748b' }}>Click on elements to edit their properties</small>
            </div>
          </div>
        )
      }

      // Render the component
      const root = ReactDOM.createRoot(container)
      rootRef.current = root
      root.render(React.createElement(Component))
      setIsLoading(false)

      // After render, attempt to re-select the previously selected element
      // in the next frame so layout is ready
      requestAnimationFrame(() => {
        try {
          reselectLastElement()
        } catch (e) {
          console.warn('[VisualEditor] Reselect after render failed:', e)
        }
      })
      
    } catch (err: any) {
      console.error('[VisualEditor] Render error:', err)
      setPreviewError(err?.message || 'Failed to render component')
      setIsLoading(false)
    }
  }, [jsxCode])

  // Set up event listeners for element interaction
  useEffect(() => {
    console.log('[VisualEditor] Setting up event listeners, selectMode:', isSelectMode)
    
    if (!isSelectMode) {
      console.log('[VisualEditor] Select mode disabled, skipping event listeners')
      return
    }

    const container = mountRef.current
    console.log('[VisualEditor] Container for event listeners:', container)
    
    if (!container) {
      console.log('[VisualEditor] No container, skipping event listeners')
      return
    }

    // Create overlay
    console.log('[VisualEditor] Creating selection overlay')
    createSelectionOverlay()

    // Add event listeners
    console.log('[VisualEditor] Adding event listeners to container')
    container.addEventListener('mouseover', handleElementHover)
    container.addEventListener('click', handleElementClick)
    container.addEventListener('mouseleave', hideOverlay)

    return () => {
      console.log('[VisualEditor] Cleaning up event listeners')
      container.removeEventListener('mouseover', handleElementHover)
      container.removeEventListener('click', handleElementClick)
      container.removeEventListener('mouseleave', hideOverlay)
      hideOverlay()
    }
  }, [isSelectMode])

  // Clean up overlay and timers on unmount
  useEffect(() => {
    return () => {
      if (overlayRef.current) {
        document.body.removeChild(overlayRef.current)
        overlayRef.current = null
      }
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
        syncTimerRef.current = null
      }
    }
  }, [])

  if (previewError) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">Visual Editor</h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-96 text-center p-8">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-700 mb-2">Editor Error</h3>
          <p className="text-sm text-red-600">{previewError}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">Visual Editor</h3>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <span className="text-gray-600">Loading visual editor...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Visual Editor</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSelectMode(!isSelectMode)}
            className={`flex items-center px-3 py-1 text-xs rounded transition-colors ${
              isSelectMode 
                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <MousePointer className="w-3 h-3 mr-1" />
            Select Mode
          </button>
          <button
            onClick={testJSXParser}
            className="flex items-center px-3 py-1 text-xs rounded bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200"
          >
            Test Parser
          </button>
          {selectedElement && (
            <div className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded border border-green-200">
              <Settings className="w-3 h-3 mr-1" />
              {selectedElement.tagName} selected
            </div>
          )}
        </div>
      </div>

      {/* Editor content */}
      <div className="flex h-96">
        {/* Left: Visual preview */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <div 
            ref={mountRef} 
            className={`min-h-full ${isSelectMode ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ position: 'relative' }}
          >
            {/* Component will be rendered here */}
          </div>
        </div>

        {/* Right: Property panel */}
        {(() => {
          console.log('[VisualEditor] Checking if property panel should render. selectedElement:', selectedElement)
          return selectedElement && (
            <div className="w-80 border-l border-gray-200 bg-white">
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                Properties: {selectedElement.tagName}
              </h4>
              
              {/* Element info */}
              <div className="mb-4 p-3 bg-gray-50 rounded text-xs">
                <div className="text-gray-600 mb-1">Path:</div>
                <div className="font-mono text-gray-900">{selectedElement.path}</div>
              </div>

              {/* Basic properties */}
              <div className="space-y-3">
                {selectedElement.properties.textContent && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Text Content
                    </label>
                    <input
                      type="text"
                      value={selectedElement.properties.textContent}
                      onChange={(e) => {
                        handlePropertyChange('textContent', e.target.value, 'text')
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={selectedElement.properties.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#ffffff' : selectedElement.properties.backgroundColor}
                    onChange={(e) => {
                      handlePropertyChange('backgroundColor', e.target.value, 'style')
                    }}
                    className="w-full h-8 rounded border border-gray-300"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={selectedElement.properties.color}
                    onChange={(e) => {
                      handlePropertyChange('color', e.target.value, 'style')
                    }}
                    className="w-full h-8 rounded border border-gray-300"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Font Size
                  </label>
                  <input
                    type="text"
                    value={selectedElement.properties.fontSize}
                    onChange={(e) => {
                      handlePropertyChange('fontSize', e.target.value, 'style')
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Padding
                  </label>
                  <input
                    type="text"
                    value={selectedElement.properties.padding}
                    onChange={(e) => {
                      handlePropertyChange('padding', e.target.value, 'style')
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Debug info */}
              <details className="mt-4">
                <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(selectedElement.properties, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )})()}
      </div>

      {/* Embedded CSS */}
      {cssCode && (
        <style dangerouslySetInnerHTML={{ __html: cssCode }} />
      )}
    </div>
  )
}
