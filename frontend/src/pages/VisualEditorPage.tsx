import React, { useState, useRef, useEffect } from 'react'
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live'
import { Code, Eye, MousePointer, Palette, Type, Square, Save, Copy } from 'lucide-react'

// Default component code for demo
const DEFAULT_COMPONENT = `function MyComponent() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f9ff', 
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif' 
    }}>
      <h1 style={{ 
        color: '#1e40af', 
        fontSize: '24px', 
        marginBottom: '16px' 
      }}>
        Hello World
      </h1>
      <p style={{ 
        color: '#374151', 
        fontSize: '16px',
        lineHeight: '1.5' 
      }}>
        This is a sample React component. Click on any element to edit its properties!
      </p>
      <button style={{
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        marginTop: '16px',
        cursor: 'pointer'
      }}>
        Click Me
      </button>
    </div>
  )
}`

interface SelectedElement {
  element: HTMLElement
  path: string
  tagName: string
  textContent: string
  styles: Record<string, string>
}

export function VisualEditorPage() {
  const [code, setCode] = useState(DEFAULT_COMPONENT)
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [isSelectMode, setIsSelectMode] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  // Get element path for identification
  const getElementPath = (element: HTMLElement): string => {
    const path: string[] = []
    let current = element
    
    while (current && current !== previewRef.current) {
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

  // Extract styles from element
  const extractStyles = (element: HTMLElement): Record<string, string> => {
    const computed = window.getComputedStyle(element)
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      padding: computed.padding,
      margin: computed.margin,
      borderRadius: computed.borderRadius,
    }
  }

  // Update element style and sync to code
  const updateElementStyle = (property: string, value: string) => {
    if (!selectedElement) return

    // Update the DOM immediately for visual feedback
    const element = selectedElement.element
    if (property === 'textContent') {
      element.textContent = value
    } else {
      element.style[property as any] = value
    }

    // Simple code update - this is a basic approach for demo
    // In production, you might want more sophisticated code manipulation
    const updatedCode = updateCodeProperty(code, property, value)
    setCode(updatedCode)

    // Update selected element state
    setSelectedElement(prev => prev ? {
      ...prev,
      textContent: property === 'textContent' ? value : prev.textContent,
      styles: property !== 'textContent' ? { ...prev.styles, [property]: value } : prev.styles
    } : null)
  }

  // Simple code property update (basic string replacement for demo)
  const updateCodeProperty = (currentCode: string, property: string, value: string): string => {
    // This is a simplified approach - in production you might want AST manipulation
    // But for MVP, this works for basic style updates
    return currentCode
  }

  // Handle element selection
  useEffect(() => {
    if (!isSelectMode || !previewRef.current) return

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (!target || !previewRef.current?.contains(target)) return

      e.preventDefault()
      e.stopPropagation()

      const path = getElementPath(target)
      const styles = extractStyles(target)
      const textContent = target.childNodes.length === 1 && 
                          target.childNodes[0].nodeType === Node.TEXT_NODE 
                          ? target.textContent || '' 
                          : ''

      setSelectedElement({
        element: target,
        path,
        tagName: target.tagName.toLowerCase(),
        textContent,
        styles
      })

      // Visual selection feedback
      document.querySelectorAll('.visual-editor-selected').forEach(el => 
        el.classList.remove('visual-editor-selected'))
      target.classList.add('visual-editor-selected')
    }

    const container = previewRef.current
    container.addEventListener('click', handleClick)

    return () => {
      container.removeEventListener('click', handleClick)
    }
  }, [isSelectMode])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Visual Component Editor</h1>
              <button
                onClick={() => setIsSelectMode(!isSelectMode)}
                className={`flex items-center px-3 py-1 text-sm rounded transition-colors ${
                  isSelectMode 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <MousePointer className="w-4 h-4 mr-2" />
                Select Mode {isSelectMode ? 'ON' : 'OFF'}
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCopyCode}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  copySuccess 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Copy className="w-4 h-4 mr-2" />
                {copySuccess ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Left: Code Editor */}
          <div className="col-span-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900">React Component Code</h3>
              </div>
            </div>
            <div className="h-full">
              <LiveProvider code={code} scope={{ React }}>
                <LiveEditor
                  onChange={(newCode) => setCode(newCode)}
                  style={{
                    fontFamily: 'Monaco, Menlo, monospace',
                    fontSize: '14px',
                    height: '100%',
                    overflow: 'auto'
                  }}
                />
              </LiveProvider>
            </div>
          </div>

          {/* Right: Preview + Properties */}
          <div className="col-span-6 space-y-6">
            {/* Preview */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-900">Live Preview</h3>
                </div>
                {selectedElement && (
                  <div className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {selectedElement.tagName} selected
                  </div>
                )}
              </div>
              <div 
                ref={previewRef}
                className={`p-6 min-h-[300px] ${isSelectMode ? 'cursor-crosshair' : 'cursor-default'}`}
              >
                <LiveProvider code={code} scope={{ React }}>
                  <LivePreview />
                  <LiveError />
                </LiveProvider>
              </div>
            </div>

            {/* Properties Panel */}
            {selectedElement && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <Palette className="w-4 h-4 mr-2" />
                    Properties: {selectedElement.tagName}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{selectedElement.path}</p>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Text Content */}
                  {selectedElement.textContent && (
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Type className="w-4 h-4 mr-2" />
                        Text Content
                      </label>
                      <input
                        type="text"
                        value={selectedElement.textContent}
                        onChange={(e) => updateElementStyle('textContent', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* Color */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Square className="w-4 h-4 mr-2" />
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={selectedElement.styles.color || '#000000'}
                      onChange={(e) => updateElementStyle('color', e.target.value)}
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={selectedElement.styles.backgroundColor || '#ffffff'}
                      onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Font Size
                    </label>
                    <input
                      type="text"
                      value={selectedElement.styles.fontSize || ''}
                      onChange={(e) => updateElementStyle('fontSize', e.target.value)}
                      placeholder="e.g. 16px"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for selection highlight */}
      <style>{`
        .visual-editor-selected {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }
      `}</style>
    </div>
  )
}
