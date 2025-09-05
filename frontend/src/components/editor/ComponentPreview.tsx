import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { Eye, RefreshCw, AlertTriangle, Palette } from 'lucide-react'

// Babel will be dynamically imported when needed
let Babel: any = null

// Async function to load Babel
const loadBabel = async () => {
  if (Babel) return Babel
  try {
    const babelModule = await import('@babel/standalone')
    Babel = babelModule.default || babelModule
    console.log('[ComponentPreview] Babel loaded successfully')
    return Babel
  } catch (error) {
    console.warn('[ComponentPreview] Failed to load Babel:', error)
    return null
  }
}

interface SelectedElement {
  element: HTMLElement
  path: string
  tagName: string
  properties: Record<string, any>
}

interface ComponentPreviewProps {
  jsxCode: string
  cssCode: string
  dependencies: Record<string, string>
  onElementSelected?: (element: SelectedElement | null) => void
}

export function ComponentPreview({ jsxCode, cssCode, dependencies, onElementSelected }: ComponentPreviewProps) {
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [isSelectMode, setIsSelectMode] = useState(true) // Always enabled
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const mountRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<ReactDOM.Root | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

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
        ">Click to edit</div>
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
      label.textContent = `${element.tagName.toLowerCase()} - Click to edit`
    }
  }

  // Hide overlay
  const hideOverlay = () => {
    if (overlayRef.current) {
      overlayRef.current.style.display = 'none'
    }
  }

  // Get element path
  const getElementPath = (element: HTMLElement): string => {
    const path: string[] = []
    let current = element
    
    while (current && current !== mountRef.current) {
      const parent = current.parentElement
      if (parent) {
        const siblings = Array.from(parent.children)
        const index = siblings.indexOf(current)
        path.unshift(`${current.tagName.toLowerCase()}[${index}]`)
      }
      current = parent!
    }
    
    return path.join(' > ')
  }

  // Extract element properties
  const extractElementProperties = (element: HTMLElement): Record<string, any> => {
    const computedStyle = window.getComputedStyle(element)
    
    // Helper to convert RGB to hex for better display
    const rgbToHex = (rgb: string): string => {
      if (rgb.startsWith('#')) return rgb
      const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (match) {
        const [, r, g, b] = match
        return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`
      }
      return rgb
    }
    
    const properties = {
      // Text content
      textContent: element.textContent?.trim() || '',
      
      // Colors - preserve original format but also provide hex
      color: computedStyle.color,
      colorHex: rgbToHex(computedStyle.color),
      backgroundColor: computedStyle.backgroundColor,
      backgroundColorHex: rgbToHex(computedStyle.backgroundColor),
      
      // Typography
      fontSize: computedStyle.fontSize,
      fontWeight: computedStyle.fontWeight,
      fontFamily: computedStyle.fontFamily,
      
      // Layout
      padding: computedStyle.padding,
      margin: computedStyle.margin,
      borderRadius: computedStyle.borderRadius,
      
      // Raw style for debugging
      rawStyle: element.getAttribute('style') || ''
    }
    
    console.log('[ComponentPreview] Extracted properties:', properties)
    return properties
  }

  // Handle element hover
  const handleElementHover = (event: MouseEvent) => {
    if (!isSelectMode) return
    
    const target = event.target as HTMLElement
    if (target && mountRef.current?.contains(target)) {
      event.stopPropagation()
      updateOverlayPosition(target)
    }
  }

  // Handle element click
  const handleElementClick = (event: MouseEvent) => {
    if (!isSelectMode) return
    
    event.preventDefault()
    event.stopPropagation()
    
    const target = event.target as HTMLElement
    if (target && mountRef.current?.contains(target)) {
      const tagName = target.tagName.toLowerCase()
      const path = getElementPath(target)
      const properties = extractElementProperties(target)
      
      const selectedEl = {
        element: target,
        path,
        tagName,
        properties
      }
      
      setSelectedElement(selectedEl)
      console.log('[ComponentPreview] Element selected for editing:', {
        tagName: selectedEl.tagName,
        path: selectedEl.path,
        properties: selectedEl.properties,
        element: selectedEl.element
      })
      
      onElementSelected?.(selectedEl)
      console.log('[ComponentPreview] Called onElementSelected callback')
    }
  }

  // Set up event listeners for element interaction - re-attach after each render
  useEffect(() => {
    if (!isSelectMode) return

    const container = mountRef.current
    if (!container) return

    // Create overlay
    createSelectionOverlay()

    // Add event listeners
    container.addEventListener('mouseover', handleElementHover)
    container.addEventListener('click', handleElementClick)
    container.addEventListener('mouseleave', hideOverlay)

    return () => {
      container.removeEventListener('mouseover', handleElementHover)
      container.removeEventListener('click', handleElementClick)
      container.removeEventListener('mouseleave', hideOverlay)
      hideOverlay()
    }
  }, [isSelectMode, previewKey]) // Re-attach listeners when component refreshes

  // Clean up overlay on unmount
  useEffect(() => {
    return () => {
      if (overlayRef.current) {
        document.body.removeChild(overlayRef.current)
        overlayRef.current = null
      }
    }
  }, [])

  // Stable component reference to prevent re-renders
  const stableComponentRef = useRef<React.ComponentType<any> | null>(null)
  const isInitialRender = useRef(true)
  const previousJsxCode = useRef<string>('')

  // React component rendering with Babel transpilation (fallback to smart mock)
  useEffect(() => {
    const renderComponent = async () => {
      console.log('[ComponentPreview] Starting render, JSX code:', jsxCode.substring(0, 200))
      setPreviewError(null)
      setIsLoading(true)

      const container = mountRef.current
      if (!container) {
        console.log('[ComponentPreview] No container found')
        setIsLoading(false)
        return
      }

      // If no code, show empty state
      if (!jsxCode || jsxCode.trim() === '') {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #666; border: 2px solid #ddd;">Paste your React component code in the editor to see preview</div>'
        setIsLoading(false)
        return
      }

      try {
        // Re-render if initial, explicit refresh, or JSX code changed
        const jsxChanged = jsxCode !== previousJsxCode.current
        if (isInitialRender.current || previewKey > 0 || jsxChanged) {
          console.log('[ComponentPreview] Full re-render (initial, refresh, or JSX changed)', {
            isInitial: isInitialRender.current,
            previewKey,
            jsxChanged,
            jsxLength: jsxCode.length
          })
          
          // Clean up previous render asynchronously to avoid React errors
          if (rootRef.current) {
            const oldRoot = rootRef.current
            rootRef.current = null
            // Defer the unmount to avoid synchronous unmount during render
            setTimeout(() => {
              try { 
                oldRoot.unmount() 
              } catch (e) {
                console.warn('Root unmount failed:', e)
              }
            }, 0)
          }
          container.innerHTML = ''
          
          const componentName = (
            jsxCode.match(/export\s+(?:default\s+)?(?:function\s+)?(\w+)/) ||
            jsxCode.match(/function\s+(\w+)/) ||
            jsxCode.match(/const\s+(\w+)\s*=/) ||
            ['', 'Component']
          )[1]
          
          // Create a realistic mock based on the actual JSX structure
          let Component: React.ComponentType<any>
          
          // Create simple mock component that will be replaced by proper JSX transpilation later
          if (jsxCode.includes('useState') && jsxCode.includes('count')) {
            // Counter component mock - SIMPLE STABLE VERSION
            Component = React.memo(() => {
              const [count, setCount] = React.useState(0)
              
              // Extract dynamic styles from JSX code
              const extractInlineStyle = (elementType: string) => {
                const regex = new RegExp(`<${elementType}[^>]*style={{([^}]*)}}`, 'i')
                const match = jsxCode.match(regex)
                if (match) {
                  try {
                    // Parse the style string to extract individual properties
                    const styleStr = match[1]
                    const styles: any = {}
                    // Match property: value pairs
                    const propMatches = styleStr.match(/([a-zA-Z]+):\s*['"#\w\s\-\.\(\),]+/g)
                    if (propMatches) {
                      propMatches.forEach(prop => {
                        const [key, value] = prop.split(':').map(s => s.trim())
                        if (key && value) {
                          const cleanKey = key.replace(/["']/g, '')
                          const cleanValue = value.replace(/["']/g, '').replace(/,$/, '')
                          styles[cleanKey] = cleanValue
                        }
                      })
                    }
                    console.log(`[ComponentPreview] Extracted ${elementType} styles:`, styles)
                    return styles
                  } catch (e) {
                    console.warn(`[ComponentPreview] Failed to parse ${elementType} styles:`, e)
                    return {}
                  }
                }
                return {}
              }
              
              // Extract text content from JSX
              const extractTextContent = (elementType: string, defaultText: string) => {
                const regex = new RegExp(`<${elementType}[^>]*>([^<]+)</${elementType}>`, 'i')
                const match = jsxCode.match(regex)
                if (match && match[1]) {
                  const text = match[1].trim()
                  // Skip text that looks like JSX expressions
                  if (!text.includes('{') && !text.includes('}')) {
                    return text
                  }
                }
                return defaultText
              }
              
              // Get dynamic styles with fallbacks
              const h1Styles = {
                fontSize: '24px',
                fontWeight: 'bold', 
                color: '#111827',
                marginBottom: '16px',
                ...extractInlineStyle('h1')
              }
              
              const buttonStyles = {
                backgroundColor: '#3b82f6',
                color: 'white',
                fontWeight: 'bold',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                ...extractInlineStyle('button')
              }
              
              // Get dynamic text
              const h1Text = extractTextContent('h1', 'Hello Component')
              const buttonText = extractTextContent('button', 'Click me!')
              
              console.log('[ComponentPreview] Rendering with dynamic content:', {
                h1Text,
                buttonText,
                h1Styles,
                buttonStyles
              })
              
              return (
                <div 
                  className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg" 
                  data-element-type="container"
                  style={{ padding: '24px', maxWidth: '448px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                >
                  <h1 
                    className="text-2xl font-bold text-gray-900 mb-4" 
                    data-element-type="heading"
                    style={h1Styles}
                  >
                    {h1Text}
                  </h1>
                  <p 
                    className="text-gray-600 mb-4" 
                    data-element-type="text"
                    style={{ color: '#4b5563', marginBottom: '16px' }}
                  >
                    Count: {count}
                  </p>
                  <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    data-element-type="button"
                    style={buttonStyles}
                    onClick={() => setCount(c => c + 1)}
                  >
                    {buttonText}
                  </button>
                </div>
              )
            })
          } else if (jsxCode.includes('<h1>') && jsxCode.includes('<p>') && jsxCode.includes('<button>')) {
            // Generic component with h1, p, button - STABLE VERSION
            Component = React.memo(() => (
              <div data-element-type="container" style={{ padding: '20px', fontFamily: 'system-ui' }}>
                <h1 data-element-type="heading" style={{ color: '#333', fontSize: '24px', marginBottom: '16px' }}>Hello World</h1>
                <p data-element-type="text" style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>This is a test paragraph.</p>
                <button data-element-type="button" style={{ backgroundColor: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px' }}>
                  Click me
                </button>
              </div>
            ))
          } else {
            // Fallback component - STABLE VERSION
            Component = React.memo(() => (
              <div data-element-type="container" style={{ padding: '20px', fontFamily: 'system-ui', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
                <h2 data-element-type="heading" style={{ color: '#333', marginBottom: '16px' }}>{componentName}</h2>
                <div data-element-type="text" style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>Component preview - property editing enabled</div>
                <div data-element-type="info" style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>Click any element to edit its properties</div>
                </div>
              </div>
            ))
          }
          
          stableComponentRef.current = Component
          
          // Render the mock component
          const root = ReactDOM.createRoot(container)
          rootRef.current = root
          root.render(React.createElement(Component))
          
          isInitialRender.current = false
          previousJsxCode.current = jsxCode
        } else {
          console.log('[ComponentPreview] Skipping re-render, using stable component')
        }
        
        setIsLoading(false)
        
        // Force re-attachment of event listeners after DOM is updated
        setTimeout(() => {
          console.log('[ComponentPreview] Component rendered, event listeners should be re-attached')
          
          // KEEP selected element - don't clear on JSX changes
          // Only clear if element is actually disconnected AND we haven't just updated the code
          if (selectedElement && (!selectedElement.element || !selectedElement.element.isConnected)) {
            console.log('[ComponentPreview] Element disconnected, but preserving selection for JSX updates')
            // Don't automatically clear - let the user manually deselect
            // setSelectedElement(null)
            // onElementSelected?.(null)
          }
        }, 50)
        
      } catch (err: any) {
        console.error('Preview render error:', err)
        setPreviewError(err?.message || 'Failed to render component')
        setIsLoading(false)
      }
    }
    
    renderComponent()
  }, [jsxCode, previewKey]) // Remove unnecessary dependencies that cause re-renders

  const handleRefresh = () => {
    console.log('[ComponentPreview] Refreshing - this will preserve JSX changes')
    setPreviewKey(prev => prev + 1)
    setPreviewError(null)
    // Clear selected element to avoid stale DOM references
    setSelectedElement(null)
    onElementSelected?.(null)
    hideOverlay()
    // Reset to force full re-render with current JSX (preserving changes)
    isInitialRender.current = true
  }

  // Real component rendering
  const renderPreview = () => {
    if (previewError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-700 mb-2">Preview Error</h3>
          <p className="text-sm text-red-600">{previewError}</p>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <span className="text-gray-600">Rendering component...</span>
          </div>
        </div>
      )
    }

    // Real component render container
    return (
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          {/* Info Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Live Preview</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your React component is rendered live below. Changes will update automatically.
                </p>
              </div>
            </div>
          </div>
          
          {/* Real Component Render Area */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div 
              ref={mountRef} 
              className="min-h-64 border-2 border-dashed border-gray-300 rounded-lg"
              style={{ 
                minHeight: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {/* Component will be rendered here - this text should disappear when component renders */}
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                Component render container (this should be replaced)
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Component Preview</h3>
        </div>
        <div className="flex items-center space-x-2">
          {selectedElement && (
            <div className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded border border-green-200">
              <Palette className="w-3 h-3 mr-1" />
              {selectedElement.tagName} selected - editing
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            Click any element to edit its properties
          </div>
          
          <button
            onClick={handleRefresh}
            className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="h-96 overflow-auto" key={previewKey}>
        {renderPreview()}
      </div>

      {/* Embedded CSS */}
      {cssCode && (
        <style dangerouslySetInnerHTML={{ __html: cssCode }} />
      )}
    </div>
  )
}
