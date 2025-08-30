import React, { useState, useEffect } from 'react'
import { Eye, RefreshCw, AlertTriangle } from 'lucide-react'

interface ComponentPreviewProps {
  jsxCode: string
  cssCode: string
  dependencies: Record<string, string>
}

export function ComponentPreview({ jsxCode, cssCode, dependencies }: ComponentPreviewProps) {
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  // Basic code validation
  useEffect(() => {
    setPreviewError(null)
    
    // Simple validation - check for basic React component structure
    // Accept both default exports and named exports
    const hasExport = jsxCode.includes('export default') || 
                     jsxCode.includes('export function') || 
                     jsxCode.includes('export const') ||
                     jsxCode.includes('function ')
    
    if (!hasExport) {
      setPreviewError('Component must have an export or function declaration')
      return
    }

    // React import is not strictly required for modern React (JSX Transform)
    // Only warn if there are React-specific patterns without import
    const hasReactPatterns = jsxCode.includes('React.') || jsxCode.includes('useState') || jsxCode.includes('useEffect')
    const hasReactImport = jsxCode.includes('React') || jsxCode.includes('import')
    
    if (hasReactPatterns && !hasReactImport) {
      // This is just a warning, not an error
      console.warn('Component uses React patterns but may be missing React import')
    }

    // Check for common syntax errors
    const openBraces = (jsxCode.match(/{/g) || []).length
    const closeBraces = (jsxCode.match(/}/g) || []).length
    if (openBraces !== closeBraces) {
      setPreviewError('Mismatched braces in JSX code')
      return
    }

    const openParens = (jsxCode.match(/\(/g) || []).length
    const closeParens = (jsxCode.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      setPreviewError('Mismatched parentheses in JSX code')
      return
    }
  }, [jsxCode])

  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1)
    setPreviewError(null)
  }

  // Mock preview since we can't execute arbitrary code in the browser safely
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

    // Show a mock component based on the code content
    const componentName = (
      jsxCode.match(/export\s+function\s+(\w+)/)?.[1] ||
      jsxCode.match(/export\s+default\s+function\s+(\w+)/)?.[1] ||
      jsxCode.match(/function\s+(\w+)/)?.[1] ||
      jsxCode.match(/const\s+(\w+)\s*=/)?.[1] ||
      jsxCode.match(/export\s+const\s+(\w+)/)?.[1] ||
      'Component'
    )
    
    // Create a more realistic mock based on common component patterns
    const createMockComponent = () => {
      const isButton = jsxCode.toLowerCase().includes('button')
      const isCard = jsxCode.toLowerCase().includes('card')
      const isInput = jsxCode.toLowerCase().includes('input')
      const isModal = jsxCode.toLowerCase().includes('modal')
      
      if (isButton) {
        return (
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
              Secondary Button
            </button>
          </div>
        )
      }
      
      if (isCard) {
        return (
          <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Sample Card</h3>
              <p className="text-gray-600 mb-4">This is a preview of what your card component might look like when rendered.</p>
              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded">Action</button>
            </div>
          </div>
        )
      }
      
      if (isInput) {
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Input</label>
              <input 
                type="text" 
                placeholder="Enter text here..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )
      }
      
      if (isModal) {
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sample Modal</h3>
              <button className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-gray-600 mb-4">This is a preview of your modal component.</p>
            <div className="flex justify-end space-x-2">
              <button className="px-3 py-1 text-gray-600 border border-gray-300 rounded">Cancel</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded">Confirm</button>
            </div>
          </div>
        )
      }
      
      // Default generic component
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">{componentName}</h3>
          <p className="text-gray-600 mb-4">This is a mock preview of your React component.</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>⚛️ React</span>
            <span>📝 {jsxCode.split('\n').length} lines</span>
            <span>🎨 {cssCode ? 'With CSS' : 'No CSS'}</span>
          </div>
        </div>
      )
    }
    
    return (
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-2xl mx-auto">
          {/* Info Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Eye className="w-5 h-5 text-amber-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Preview Mode</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This is a mock preview for security reasons. In production, this would be rendered in a secure sandbox.
                </p>
              </div>
            </div>
          </div>
          
          {/* Mock Component */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{componentName} Preview</h3>
            </div>
            
            {/* Rendered Mock Component */}
            <div className="flex justify-center">
              {createMockComponent()}
            </div>
            
            {/* Component Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{jsxCode.split('\n').length}</div>
                  <div className="text-gray-500">Lines of Code</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{cssCode ? cssCode.split('{').length - 1 : 0}</div>
                  <div className="text-gray-500">CSS Rules</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{Object.keys(dependencies).length}</div>
                  <div className="text-gray-500">Dependencies</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">React</div>
                  <div className="text-gray-500">Framework</div>
                </div>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderPreview()
        )}
      </div>

      {/* Embedded CSS */}
      {cssCode && (
        <style dangerouslySetInnerHTML={{ __html: cssCode }} />
      )}
    </div>
  )
}
