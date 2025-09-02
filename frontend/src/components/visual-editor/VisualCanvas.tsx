import React, { useState, useRef, useCallback } from 'react'
import { ComponentElement, ComponentState } from './types'

interface VisualCanvasProps {
  component: ComponentState
  selectedElement: string | null
  onSelectElement: (elementId: string | null) => void
  onUpdateElement: (elementId: string, updates: Partial<ComponentElement>) => void
  onUpdateContent: (elementId: string, content: string) => void
}

interface EditableTextProps {
  element: ComponentElement
  isSelected: boolean
  onSelect: () => void
  onUpdateContent: (content: string) => void
}

function EditableText({ element, isSelected, onSelect, onUpdateContent }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(element.content)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditValue(element.content)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSave = () => {
    onUpdateContent(editValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(element.content)
      setIsEditing(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent border-0 outline-none"
        style={{
          ...element.styles,
          border: '2px dashed #3b82f6',
          background: 'rgba(59, 130, 246, 0.1)'
        }}
      />
    )
  }

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-300'
      }`}
      style={element.styles}
    >
      {element.content || 'Click to edit text'}
    </div>
  )
}

interface VisualElementProps {
  element: ComponentElement
  isSelected: boolean
  selectedElement: string | null
  onSelect: () => void
  onSelectElement: (elementId: string | null) => void
  onUpdateContent: (content: string) => void
}

function VisualElement({ element, isSelected, selectedElement, onSelect, onSelectElement, onUpdateContent }: VisualElementProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  // Handle different element types
  const renderElement = () => {
    const commonProps = {
      onClick: handleClick,
      className: `relative ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-300'
      }`,
      style: {
        ...element.styles,
        transition: 'box-shadow 0.2s ease, opacity 0.2s ease'
      }
    }

    switch (element.type) {
      case 'text':
        return (
          <EditableText
            element={element}
            isSelected={isSelected}
            onSelect={onSelect}
            onUpdateContent={onUpdateContent}
          />
        )

      case 'button':
        return (
          <button {...commonProps}>
            <EditableText
              element={{ ...element, styles: { background: 'transparent', border: 'none', padding: '0' } }}
              isSelected={false}
              onSelect={() => {}}
              onUpdateContent={onUpdateContent}
            />
          </button>
        )

      case 'input':
        return (
          <div {...commonProps}>
            <input
              type={element.inputType || 'text'}
              placeholder={element.placeholder || 'Enter text...'}
              required={element.required || false}
              disabled={element.disabled || false}
              maxLength={element.maxLength}
              minLength={element.minLength}
              style={{ 
                ...element.styles, 
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                opacity: element.disabled ? 0.6 : 1,
                cursor: element.disabled ? 'not-allowed' : 'text'
              }}
              onChange={() => {}} // Preview mode - no actual functionality
            />
            {element.required && (
              <span 
                className="absolute top-0 right-2 text-red-500 text-sm font-bold"
                title="Required field"
              >
                *
              </span>
            )}
          </div>
        )

      case 'image':
        return (
          <div className="relative">
            <img
              src={element.content || 'https://via.placeholder.com/200x150/e2e8f0/9ca3af?text=Click+to+Edit+Image'}
              alt={element.content ? 'Component image' : 'Placeholder image - click to select and edit URL'}
              onClick={handleClick}
              style={{
                ...element.styles,
                transition: 'box-shadow 0.2s ease, opacity 0.2s ease'
              }}
              className={`max-w-full h-auto cursor-pointer ${
                isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-300'
              }`}
            />
            {isSelected && !element.content && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 rounded pointer-events-none">
                <p className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow text-center">
                  Select this image and edit URL in Properties panel →
                </p>
              </div>
            )}
          </div>
        )

      case 'div':
      case 'container':
      case 'flex':
      default:
        return (
          <div {...commonProps}>
            {element.content && (
              <EditableText
                element={{ ...element, styles: { background: 'transparent', border: 'none', padding: '0' } }}
                isSelected={false}
                onSelect={() => {}}
                onUpdateContent={onUpdateContent}
              />
            )}
            
            {/* Render children */}
            {element.children?.map((child) => (
              <VisualElement
                key={child.id}
                element={child}
                isSelected={selectedElement === child.id}
                selectedElement={selectedElement}
                onSelect={() => onSelectElement(child.id)}
                onSelectElement={onSelectElement}
                onUpdateContent={(content) => onUpdateContent(child.id, content)}
              />
            ))}

            {/* Empty state */}
            {!element.content && (!element.children || element.children.length === 0) && (
              <div className="text-gray-400 text-center p-8 border-2 border-dashed border-gray-200">
                Empty container • Click to select, drag elements here
              </div>
            )}

          </div>
        )
    }
  }

  return (
    <div className="relative">
      {renderElement()}
    </div>
  )
}

// Helper function to find element by ID in nested structure
function findElementById(elements: ComponentElement[], targetId: string): ComponentElement | null {
  for (const element of elements) {
    if (element.id === targetId) {
      return element
    }
    if (element.children && element.children.length > 0) {
      const found = findElementById(element.children, targetId)
      if (found) return found
    }
  }
  return null
}

export function VisualCanvas({
  component,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  onUpdateContent
}: VisualCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleCanvasClick = (e: React.MouseEvent) => {
    // If clicking on the canvas background, deselect element
    if (e.target === canvasRef.current) {
      onSelectElement(null)
    }
  }

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 overflow-auto">
      {/* Canvas Header */}
      <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900">{component.name}</h3>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              Live Preview
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Click to select • Double-click text to edit</span>
          </div>
        </div>
      </div>

      {/* Canvas Content */}
      <div 
        ref={canvasRef}
        className="p-6 min-h-96"
        onClick={handleCanvasClick}
        style={{
          ...component.globalStyles,
          minHeight: '500px'
        }}
      >
        {component.elements.map((element) => (
          <VisualElement
            key={element.id}
            element={element}
            isSelected={selectedElement === element.id}
            selectedElement={selectedElement}
            onSelect={() => onSelectElement(element.id)}
            onSelectElement={onSelectElement}
            onUpdateContent={(content) => onUpdateContent(element.id, content)}
          />
        ))}

        {/* Empty state */}
        {component.elements.length === 0 && (
          <div className="flex items-center justify-center h-64 text-center">
            <div className="text-gray-400">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-lg font-medium mb-2">Start Building</h3>
              <p className="text-sm">
                Add elements from the toolbar above to start creating your component
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selection Info */}
      {selectedElement && (() => {
        const selectedElementData = findElementById(component.elements, selectedElement)
        return (
          <div className="border-t border-gray-200 px-4 py-2 bg-blue-50">
            <div className="text-xs text-blue-700">
              Selected: {selectedElementData?.type || 'unknown'} element
              {selectedElementData?.type === 'container' && ' (container)'}
              {selectedElementData?.type === 'flex' && ' (flex container)'}
              • Edit properties in the panel →
            </div>
          </div>
        )
      })()}
    </div>
  )
}
