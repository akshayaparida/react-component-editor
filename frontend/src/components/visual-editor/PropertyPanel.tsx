import React, { useState, useCallback } from 'react'
import { Palette, Type, Layout, Square, Image as ImageIcon } from 'lucide-react'
import { ComponentElement, ComponentState, STYLE_PROPERTIES } from './types'

interface PropertyPanelProps {
  selectedElement: string | null
  component: ComponentState
  onUpdateElementStyles: (elementId: string, styles: React.CSSProperties) => void
  onUpdateElementContent: (elementId: string, content: string) => void
  onUpdateElement: (elementId: string, updates: Partial<ComponentElement>) => void
  onUpdateComponent: (component: ComponentState) => void
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label: string
}

function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

interface SizeInputProps {
  value: string | number
  onChange: (value: string) => void
  label: string
  unit?: string
}

function SizeInput({ value, onChange, label, unit = 'px' }: SizeInputProps) {
  const numericValue = typeof value === 'string' ? value.replace(unit, '') : value

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center">
        <input
          type="number"
          value={numericValue}
          onChange={(e) => onChange(`${e.target.value}${unit}`)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          min="0"
        />
        <span className="ml-1 text-xs text-gray-500">{unit}</span>
      </div>
    </div>
  )
}

interface SelectInputProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  label: string
}

function SelectInput({ value, onChange, options, label }: SelectInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

interface StyleCategoryProps {
  title: string
  icon: React.ComponentType<any>
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

function StyleCategory({ title, icon: Icon, isOpen, onToggle, children }: StyleCategoryProps) {
  return (
    <div className="border border-gray-200 rounded-lg mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        <div className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

export function PropertyPanel({
  selectedElement,
  component,
  onUpdateElementStyles,
  onUpdateElementContent,
  onUpdateElement,
  onUpdateComponent
}: PropertyPanelProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    typography: true,
    spacing: false,
    background: false,
    border: false,
    layout: false,
    flexbox: false
  })

  const selectedElementData = selectedElement 
    ? component.elements.find(el => el.id === selectedElement)
    : null

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }, [])

  const handleStyleChange = useCallback((property: string, value: string) => {
    if (selectedElement) {
      onUpdateElementStyles(selectedElement, { [property]: value })
    }
  }, [selectedElement, onUpdateElementStyles])

  const handleContentChange = useCallback((content: string) => {
    if (selectedElement) {
      onUpdateElementContent(selectedElement, content)
    }
  }, [selectedElement, onUpdateElementContent])

  const handleInputPropertyChange = useCallback((property: string, value: any) => {
    if (selectedElement) {
      onUpdateElement(selectedElement, { [property]: value })
    }
  }, [selectedElement, onUpdateElement])

  if (!selectedElement || !selectedElementData) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 mb-4">
          <Layout className="w-12 h-12 mx-auto mb-3" />
          <h3 className="text-sm font-medium">No Element Selected</h3>
          <p className="text-xs mt-1">
            Click on an element in the canvas to edit its properties
          </p>
        </div>
        
        {/* Global Component Settings */}
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Component Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Component Name
              </label>
              <input
                type="text"
                value={component.name}
                onChange={(e) => onUpdateComponent({ ...component, name: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const elementStyles = selectedElementData.styles || {}
  
  // Group style properties by category
  const stylesByCategory = STYLE_PROPERTIES.reduce((acc, prop) => {
    if (!acc[prop.category]) {
      acc[prop.category] = []
    }
    acc[prop.category].push(prop)
    return acc
  }, {} as Record<string, typeof STYLE_PROPERTIES>)

  return (
    <div className="h-full overflow-auto p-4">
      {/* Element Info */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
            <span className="text-xs font-medium text-blue-600">
              {selectedElementData.type.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 capitalize">
              {selectedElementData.type} Element
            </h3>
            <p className="text-xs text-gray-500">ID: {selectedElement}</p>
          </div>
        </div>

        {/* Content Editor */}
        {(selectedElementData.type === 'text' || selectedElementData.type === 'button') && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Content
            </label>
            <input
              type="text"
              value={selectedElementData.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter text content..."
            />
          </div>
        )}

        {selectedElementData.type === 'image' && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Image URL *
            </label>
            <input
              type="url"
              value={selectedElementData.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://images.unsplash.com/photo-example.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Paste any image URL from Unsplash, your CDN, or web hosting
            </p>
          </div>
        )}

        {/* Input-specific Properties */}
        {selectedElementData.type === 'input' && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-xs font-medium text-green-800 mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Input Properties
            </h4>
            
            <div className="space-y-3">
              <SelectInput
                label="Input Type"
                value={selectedElementData.inputType || 'text'}
                onChange={(value) => handleInputPropertyChange('inputType', value)}
                options={['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time']}
              />
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={selectedElementData.placeholder || ''}
                  onChange={(e) => handleInputPropertyChange('placeholder', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter placeholder text..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedElementData.required || false}
                      onChange={(e) => handleInputPropertyChange('required', e.target.checked)}
                      className="mr-2 w-3 h-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    Required Field
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedElementData.disabled || false}
                      onChange={(e) => handleInputPropertyChange('disabled', e.target.checked)}
                      className="mr-2 w-3 h-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    Disabled
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Length
                  </label>
                  <input
                    type="number"
                    value={selectedElementData.minLength || ''}
                    onChange={(e) => handleInputPropertyChange('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="0"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Length
                  </label>
                  <input
                    type="number"
                    value={selectedElementData.maxLength || ''}
                    onChange={(e) => handleInputPropertyChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="1"
                    placeholder="No limit"
                  />
                </div>
              </div>
              
              <p className="text-xs text-green-700">
                💡 Configure input behavior and validation rules
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Typography */}
      <StyleCategory
        title="Typography"
        icon={Type}
        isOpen={openCategories.typography}
        onToggle={() => toggleCategory('typography')}
      >
        <div className="grid grid-cols-2 gap-3">
          <ColorPicker
            label="Text Color"
            value={elementStyles.color as string}
            onChange={(value) => handleStyleChange('color', value)}
          />
          <SizeInput
            label="Font Size"
            value={elementStyles.fontSize as string}
            onChange={(value) => handleStyleChange('fontSize', value)}
            unit="px"
          />
        </div>
        
        <SelectInput
          label="Font Family"
          value={elementStyles.fontFamily as string}
          onChange={(value) => handleStyleChange('fontFamily', value)}
          options={['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia']}
        />
        
        <div className="grid grid-cols-2 gap-3">
          <SelectInput
            label="Font Weight"
            value={elementStyles.fontWeight as string}
            onChange={(value) => handleStyleChange('fontWeight', value)}
            options={['300', '400', '500', '600', '700', '800']}
          />
          <SelectInput
            label="Text Align"
            value={elementStyles.textAlign as string}
            onChange={(value) => handleStyleChange('textAlign', value)}
            options={['left', 'center', 'right', 'justify']}
          />
        </div>
      </StyleCategory>

      {/* Spacing */}
      <StyleCategory
        title="Spacing"
        icon={Square}
        isOpen={openCategories.spacing}
        onToggle={() => toggleCategory('spacing')}
      >
        <div className="grid grid-cols-2 gap-3">
          <SizeInput
            label="Padding"
            value={elementStyles.padding as string}
            onChange={(value) => handleStyleChange('padding', value)}
          />
          <SizeInput
            label="Margin"
            value={elementStyles.margin as string}
            onChange={(value) => handleStyleChange('margin', value)}
          />
        </div>
      </StyleCategory>

      {/* Background */}
      <StyleCategory
        title="Background"
        icon={Palette}
        isOpen={openCategories.background}
        onToggle={() => toggleCategory('background')}
      >
        <ColorPicker
          label="Background Color"
          value={elementStyles.backgroundColor as string}
          onChange={(value) => handleStyleChange('backgroundColor', value)}
        />
      </StyleCategory>

      {/* Border */}
      <StyleCategory
        title="Border & Effects"
        icon={Layout}
        isOpen={openCategories.border}
        onToggle={() => toggleCategory('border')}
      >
        <div className="grid grid-cols-2 gap-3">
          <SizeInput
            label="Border Width"
            value={elementStyles.borderWidth as string}
            onChange={(value) => handleStyleChange('borderWidth', value)}
          />
          <SizeInput
            label="Border Radius"
            value={elementStyles.borderRadius as string}
            onChange={(value) => handleStyleChange('borderRadius', value)}
          />
        </div>
        
        <ColorPicker
          label="Border Color"
          value={elementStyles.borderColor as string}
          onChange={(value) => handleStyleChange('borderColor', value)}
        />
        
        <SelectInput
          label="Border Style"
          value={elementStyles.borderStyle as string}
          onChange={(value) => handleStyleChange('borderStyle', value)}
          options={['none', 'solid', 'dashed', 'dotted']}
        />
      </StyleCategory>

      {/* Layout */}
      <StyleCategory
        title="Layout"
        icon={Layout}
        isOpen={openCategories.layout}
        onToggle={() => toggleCategory('layout')}
      >
        <SelectInput
          label="Display"
          value={elementStyles.display as string}
          onChange={(value) => handleStyleChange('display', value)}
          options={['block', 'flex', 'grid', 'inline', 'inline-block', 'none']}
        />
        
        <div className="grid grid-cols-2 gap-3">
          <SizeInput
            label="Width"
            value={elementStyles.width as string}
            onChange={(value) => handleStyleChange('width', value)}
          />
          <SizeInput
            label="Height"
            value={elementStyles.height as string}
            onChange={(value) => handleStyleChange('height', value)}
          />
        </div>

      </StyleCategory>

      {/* Flexbox Properties - Show for flex containers and flex-type elements */}
      {(selectedElementData.type === 'flex' || elementStyles.display === 'flex') && (
        <StyleCategory
          title="Flexbox Properties"
          icon={Layout}
          isOpen={openCategories.flexbox}
          onToggle={() => toggleCategory('flexbox')}
        >
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <h5 className="text-xs font-medium text-purple-800 mb-2 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Flex Container Controls
            </h5>
            <p className="text-xs text-purple-700">
              Configure how child elements are arranged and aligned
            </p>
          </div>
          
          <SelectInput
            label="Flex Direction"
            value={elementStyles.flexDirection as string}
            onChange={(value) => handleStyleChange('flexDirection', value)}
            options={['row', 'column', 'row-reverse', 'column-reverse']}
          />
          
          <div className="grid grid-cols-1 gap-3">
            <SelectInput
              label="Justify Content (Main Axis)"
              value={elementStyles.justifyContent as string}
              onChange={(value) => handleStyleChange('justifyContent', value)}
              options={['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']}
            />
            <SelectInput
              label="Align Items (Cross Axis)"
              value={elementStyles.alignItems as string}
              onChange={(value) => handleStyleChange('alignItems', value)}
              options={['flex-start', 'center', 'flex-end', 'stretch', 'baseline']}
            />
          </div>
          
          <SelectInput
            label="Flex Wrap"
            value={elementStyles.flexWrap as string}
            onChange={(value) => handleStyleChange('flexWrap', value)}
            options={['nowrap', 'wrap', 'wrap-reverse']}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <SizeInput
              label="Gap"
              value={elementStyles.gap as string}
              onChange={(value) => handleStyleChange('gap', value)}
              unit="px"
            />
            <SelectInput
              label="Align Content"
              value={elementStyles.alignContent as string}
              onChange={(value) => handleStyleChange('alignContent', value)}
              options={['flex-start', 'center', 'flex-end', 'stretch', 'space-between', 'space-around']}
            />
          </div>
          
          {/* Quick Flex Presets */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h6 className="text-xs font-medium text-gray-700 mb-2">Quick Flex Layouts</h6>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  handleStyleChange('display', 'flex')
                  handleStyleChange('justifyContent', 'center')
                  handleStyleChange('alignItems', 'center')
                }}
                className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Center All
              </button>
              <button
                onClick={() => {
                  handleStyleChange('display', 'flex')
                  handleStyleChange('justifyContent', 'space-between')
                  handleStyleChange('alignItems', 'center')
                }}
                className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Space Between
              </button>
              <button
                onClick={() => {
                  handleStyleChange('display', 'flex')
                  handleStyleChange('flexDirection', 'column')
                  handleStyleChange('gap', '12px')
                }}
                className="px-2 py-1 text-xs bg-cyan-500 text-white rounded hover:bg-cyan-600"
              >
                Column Stack
              </button>
              <button
                onClick={() => {
                  handleStyleChange('display', 'flex')
                  handleStyleChange('flexWrap', 'wrap')
                  handleStyleChange('gap', '8px')
                }}
                className="px-2 py-1 text-xs bg-teal-500 text-white rounded hover:bg-teal-600"
              >
                Wrap Grid
              </button>
            </div>
          </div>
        </StyleCategory>
      )}

      {/* Quick Actions */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleStyleChange('backgroundColor', '#3b82f6')}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Blue Theme
          </button>
          <button
            onClick={() => handleStyleChange('borderRadius', '8px')}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Round Corners
          </button>
        </div>
      </div>
    </div>
  )
}
