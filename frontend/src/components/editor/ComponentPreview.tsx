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
    if (!jsxCode.includes('export default')) {
      setPreviewError('Component must have a default export')
      return
    }

    if (!jsxCode.includes('React')) {
      setPreviewError('Component must import React')
      return
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
    const componentName = jsxCode.match(/function\s+(\w+)|const\s+(\w+)\s*=|export\s+default\s+function\s+(\w+)/)?.[1] || 'Component'
    
    return (
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{componentName} Preview</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700">
                This is a mock preview. In a production environment, you would see the actual rendered component here.
              </p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Component name: {componentName}</p>
              <p>Code lines: {jsxCode.split('\n').length}</p>
              <p>CSS rules: {cssCode.split('{').length - 1}</p>
              <p>Dependencies: {Object.keys(dependencies).length}</p>
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
