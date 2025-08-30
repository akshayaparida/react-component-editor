import React from 'react'
import { Plus, Type, Square, Image, Layers, Grid, Trash2 } from 'lucide-react'
import { ComponentElement, VISUAL_EDITOR_TOOLS } from './types'

interface ElementToolbarProps {
  onAddElement: (type: ComponentElement['type']) => void
  selectedElement: string | null
  onRemoveElement: (elementId: string) => void
}

export function ElementToolbar({ onAddElement, selectedElement, onRemoveElement }: ElementToolbarProps) {
  const tools = [
    { type: 'text' as const, icon: Type, label: 'Text', color: 'text-blue-600' },
    { type: 'button' as const, icon: Square, label: 'Button', color: 'text-green-600' },
    { type: 'input' as const, icon: Square, label: 'Input', color: 'text-purple-600' },
    { type: 'image' as const, icon: Image, label: 'Image', color: 'text-orange-600' },
    { type: 'container' as const, icon: Layers, label: 'Container', color: 'text-gray-600' },
    { type: 'flex' as const, icon: Grid, label: 'Flex Container', color: 'text-indigo-600' }
  ]

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Add Elements</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {tools.map((tool) => {
              const IconComponent = tool.icon
              return (
                <button
                  key={tool.type}
                  onClick={() => onAddElement(tool.type)}
                  className="flex items-center space-x-1 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors group"
                  title={`Add ${tool.label}`}
                >
                  <IconComponent className={`w-4 h-4 ${tool.color} group-hover:scale-110 transition-transform`} />
                  <span>{tool.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Element Actions */}
        {selectedElement && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Selected element:</span>
            <button
              onClick={() => onRemoveElement(selectedElement)}
              className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Remove selected element"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-2 text-xs text-gray-500">
        💡 Tip: Click elements to select them, double-click text to edit inline
      </div>
    </div>
  )
}
