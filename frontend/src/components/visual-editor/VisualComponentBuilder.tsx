import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Copy, Download, Save, Settings } from 'lucide-react'
import { VisualCanvas } from './VisualCanvas'
import { ComponentCodeGenerator } from './CodeGenerator'
import { PropertyPanel } from './PropertyPanel'
import { ExportPanel } from './ExportPanel'
import { ElementToolbar } from './ElementToolbar'
import { ComponentElement, ComponentState } from './types'
import toast from 'react-hot-toast'

interface VisualComponentBuilderProps {
  initialComponent?: ComponentState
  onSave?: (component: ComponentState) => void
}

const defaultComponent: ComponentState = {
  id: 'root',
  name: 'MyComponent',
  elements: [
    {
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
    }
  ],
  globalStyles: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: '1.5'
  }
}

export function VisualComponentBuilder({ 
  initialComponent, 
  onSave 
}: VisualComponentBuilderProps) {
  const [component, setComponent] = useState<ComponentState>(
    initialComponent || defaultComponent
  )
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [showExportPanel, setShowExportPanel] = useState(false)
  const [activePanel, setActivePanel] = useState<'properties'>('properties')

  // Update component when initialComponent changes (for editing existing components)
  useEffect(() => {
    if (initialComponent) {
      setComponent(initialComponent)
      setSelectedElement(null) // Reset selection when component changes
    }
  }, [initialComponent])

  // Update element in component state
  const updateElement = useCallback((elementId: string, updates: Partial<ComponentElement>) => {
    setComponent(prev => {
      // Find the element and its current index to preserve ordering
      const elementIndex = prev.elements.findIndex(el => el.id === elementId);
      if (elementIndex === -1) return prev; // Element not found
      
      // Create a new elements array with the updated element at the same index
      const updatedElements = [...prev.elements];
      updatedElements[elementIndex] = { ...updatedElements[elementIndex], ...updates };
      
      return {
        ...prev,
        elements: updatedElements
      };
    });
  }, [])

  // Update element styles
  const updateElementStyles = useCallback((elementId: string, styles: React.CSSProperties) => {
    updateElement(elementId, { styles: { ...component.elements.find(el => el.id === elementId)?.styles, ...styles } })
  }, [component.elements, updateElement])

  // Update element content
  const updateElementContent = useCallback((elementId: string, content: string) => {
    updateElement(elementId, { content })
  }, [updateElement])

  // Add new element
  const addElement = useCallback((type: ComponentElement['type']) => {
    const newElement: ComponentElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'New text element' : type === 'button' ? 'Button' : type === 'input' ? '' : 'New element',
      styles: {
        padding: '8px 16px',
        margin: '8px 0',
        backgroundColor: type === 'button' ? '#3b82f6' : type === 'input' ? '#ffffff' : '#ffffff',
        color: type === 'button' ? '#ffffff' : '#374151',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        fontSize: '14px',
        ...(type === 'input' && { width: '200px' })
      },
      children: [],
      // Add default input properties for input elements
      ...(type === 'input' && {
        inputType: 'text' as const,
        placeholder: 'Enter text...',
        required: false,
        disabled: false
      })
    }

    setComponent(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }))

    setSelectedElement(newElement.id)
  }, [])

  // Remove element
  const removeElement = useCallback((elementId: string) => {
    setComponent(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }))
    
    if (selectedElement === elementId) {
      setSelectedElement(null)
    }
  }, [selectedElement])

  // Handle save
  const handleSave = useCallback(() => {
    onSave?.(component)
    // Note: Toast notification will be shown by parent component
  }, [component, onSave])

  // Generate and copy code
  const handleCopyCode = useCallback(async () => {
    try {
      const codeGenerator = new ComponentCodeGenerator(component)
      const code = codeGenerator.generateReactComponent()
      await navigator.clipboard.writeText(code)
      toast.success('Component code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }, [component])

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Visual Component Builder</h1>
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            No-Code
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Code
          </button>
          
          <button
            onClick={() => setShowExportPanel(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          {onSave && (
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Component
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Visual Builder */}
        <div className="flex-1 flex flex-col">
          {/* Element Toolbar */}
          <ElementToolbar 
            onAddElement={addElement}
            selectedElement={selectedElement}
            onRemoveElement={removeElement}
          />
          
          {/* Visual Canvas */}
          <div className="flex-1 p-6 overflow-auto">
            <VisualCanvas
              component={component}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              onUpdateElement={updateElement}
              onUpdateContent={updateElementContent}
            />
          </div>
        </div>

        {/* Right Side: Properties */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Panel Header */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-900">Properties Panel</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select an element to edit its properties
            </p>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-auto">
            <PropertyPanel
              selectedElement={selectedElement}
              component={component}
              onUpdateElementStyles={updateElementStyles}
              onUpdateElementContent={updateElementContent}
              onUpdateElement={updateElement}
              onUpdateComponent={setComponent}
            />
          </div>
        </div>
      </div>

      {/* Export Panel Modal */}
      {showExportPanel && (
        <ExportPanel
          component={component}
          onClose={() => setShowExportPanel(false)}
        />
      )}
    </div>
  )
}
