export interface ComponentElement {
  id: string
  type: 'div' | 'text' | 'button' | 'input' | 'image' | 'container' | 'flex' | 'grid'
  content: string
  styles: React.CSSProperties
  children: ComponentElement[]
  props?: Record<string, any>
  // Input-specific properties
  inputType?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  maxLength?: number
  minLength?: number
}

export interface ComponentState {
  id: string
  name: string
  elements: ComponentElement[]
  globalStyles: React.CSSProperties
  props?: ComponentProp[]
}

export interface ComponentProp {
  name: string
  type: 'string' | 'number' | 'boolean' | 'color' | 'select'
  defaultValue: any
  options?: string[]
  description?: string
}

export interface VisualEditorTool {
  id: string
  name: string
  icon: React.ComponentType<any>
  elementType: ComponentElement['type']
  defaultContent: string
  defaultStyles: React.CSSProperties
}

export interface StyleProperty {
  name: string
  label: string
  type: 'color' | 'size' | 'text' | 'number' | 'select' | 'boolean'
  options?: string[]
  unit?: string
  category: 'typography' | 'spacing' | 'background' | 'border' | 'layout' | 'effects'
}

export interface ExportFormat {
  id: string
  name: string
  description: string
  format: 'react-component' | 'react-tsx' | 'css' | 'complete-package' | 'html'
  fileExtension: string
}

// CSS Property mappings
export const STYLE_PROPERTIES: StyleProperty[] = [
  // Typography
  { name: 'color', label: 'Text Color', type: 'color', category: 'typography' },
  { name: 'fontSize', label: 'Font Size', type: 'size', unit: 'px', category: 'typography' },
  { name: 'fontFamily', label: 'Font Family', type: 'select', category: 'typography', 
    options: ['Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana'] },
  { name: 'fontWeight', label: 'Font Weight', type: 'select', category: 'typography',
    options: ['300', '400', '500', '600', '700', '800'] },
  { name: 'textAlign', label: 'Text Align', type: 'select', category: 'typography',
    options: ['left', 'center', 'right', 'justify'] },
  { name: 'lineHeight', label: 'Line Height', type: 'number', category: 'typography' },

  // Spacing
  { name: 'padding', label: 'Padding', type: 'size', unit: 'px', category: 'spacing' },
  { name: 'paddingTop', label: 'Padding Top', type: 'size', unit: 'px', category: 'spacing' },
  { name: 'paddingRight', label: 'Padding Right', type: 'size', unit: 'px', category: 'spacing' },
  { name: 'paddingBottom', label: 'Padding Bottom', type: 'size', unit: 'px', category: 'spacing' },
  { name: 'paddingLeft', label: 'Padding Left', type: 'size', unit: 'px', category: 'spacing' },
  { name: 'margin', label: 'Margin', type: 'size', unit: 'px', category: 'spacing' },
  { name: 'marginTop', label: 'Margin Top', type: 'size', unit: 'px', category: 'spacing' },
  { name: 'marginRight', label: 'Margin Right', type: 'size', unit: 'px', category: 'spacing' },
  { name: 'marginBottom', label: 'Margin Bottom', type: 'size', unit: 'px', category: 'spacing' },
  { name: 'marginLeft', label: 'Margin Left', type: 'size', unit: 'px', category: 'spacing' },

  // Background
  { name: 'backgroundColor', label: 'Background Color', type: 'color', category: 'background' },
  { name: 'backgroundImage', label: 'Background Image', type: 'text', category: 'background' },
  { name: 'backgroundSize', label: 'Background Size', type: 'select', category: 'background',
    options: ['auto', 'cover', 'contain'] },
  { name: 'backgroundPosition', label: 'Background Position', type: 'select', category: 'background',
    options: ['center', 'top', 'bottom', 'left', 'right'] },

  // Border
  { name: 'border', label: 'Border', type: 'text', category: 'border' },
  { name: 'borderWidth', label: 'Border Width', type: 'size', unit: 'px', category: 'border' },
  { name: 'borderColor', label: 'Border Color', type: 'color', category: 'border' },
  { name: 'borderStyle', label: 'Border Style', type: 'select', category: 'border',
    options: ['none', 'solid', 'dashed', 'dotted'] },
  { name: 'borderRadius', label: 'Border Radius', type: 'size', unit: 'px', category: 'border' },

  // Layout
  { name: 'display', label: 'Display', type: 'select', category: 'layout',
    options: ['block', 'flex', 'grid', 'inline', 'inline-block', 'none'] },
  { name: 'width', label: 'Width', type: 'size', unit: 'px', category: 'layout' },
  { name: 'height', label: 'Height', type: 'size', unit: 'px', category: 'layout' },
  { name: 'maxWidth', label: 'Max Width', type: 'size', unit: 'px', category: 'layout' },
  { name: 'minHeight', label: 'Min Height', type: 'size', unit: 'px', category: 'layout' },
  { name: 'position', label: 'Position', type: 'select', category: 'layout',
    options: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },

  // Flexbox
  { name: 'justifyContent', label: 'Justify Content', type: 'select', category: 'layout',
    options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] },
  { name: 'alignItems', label: 'Align Items', type: 'select', category: 'layout',
    options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'] },
  { name: 'flexDirection', label: 'Flex Direction', type: 'select', category: 'layout',
    options: ['row', 'column', 'row-reverse', 'column-reverse'] },
  { name: 'gap', label: 'Gap', type: 'size', unit: 'px', category: 'layout' },

  // Effects
  { name: 'opacity', label: 'Opacity', type: 'number', category: 'effects' },
  { name: 'boxShadow', label: 'Box Shadow', type: 'text', category: 'effects' },
  { name: 'transform', label: 'Transform', type: 'text', category: 'effects' },
  { name: 'transition', label: 'Transition', type: 'text', category: 'effects' },
]

// Visual Editor Tools - Note: icons will be handled by the consuming components
export const VISUAL_EDITOR_TOOLS = [
  {
    id: 'text',
    name: 'Text',
    elementType: 'text' as const,
    defaultContent: 'Text element',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: 'button',
    name: 'Button',
    elementType: 'button' as const,
    defaultContent: 'Click me',
    defaultStyles: {
      padding: '8px 16px',
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer'
    }
  },
  {
    id: 'container',
    name: 'Container',
    elementType: 'div' as const,
    defaultContent: '',
    defaultStyles: {
      padding: '16px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      minHeight: '100px'
    }
  },
  {
    id: 'flex',
    name: 'Flex Container',
    elementType: 'flex' as const,
    defaultContent: '',
    defaultStyles: {
      display: 'flex',
      padding: '16px',
      gap: '12px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px'
    }
  },
  {
    id: 'input',
    name: 'Input',
    elementType: 'input' as const,
    defaultContent: '',
    defaultStyles: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      width: '200px',
      backgroundColor: '#ffffff',
      color: '#374151'
    },
    defaultProps: {
      inputType: 'text',
      placeholder: 'Enter text...',
      required: false,
      disabled: false
    }
  },
  {
    id: 'image',
    name: 'Image',
    elementType: 'image' as const,
    defaultContent: '',
    defaultStyles: {
      width: '200px',
      height: '150px',
      objectFit: 'cover',
      borderRadius: '8px'
    }
  }
] as const

// Export formats
export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'react-component',
    name: 'React Component (.jsx)',
    description: 'Generate a React functional component',
    format: 'react-component',
    fileExtension: 'jsx'
  },
  {
    id: 'react-tsx',
    name: 'React TypeScript Component (.tsx)',
    description: 'Generate a TypeScript React component with types',
    format: 'react-tsx',
    fileExtension: 'tsx'
  },
  {
    id: 'css-styles',
    name: 'CSS Styles (.css)',
    description: 'Export only the CSS styles',
    format: 'css',
    fileExtension: 'css'
  },
  {
    id: 'complete-package',
    name: 'Complete Package (.zip)',
    description: 'Component + CSS + TypeScript types + usage example',
    format: 'complete-package',
    fileExtension: 'zip'
  },
  {
    id: 'html-preview',
    name: 'HTML Preview (.html)',
    description: 'Static HTML file for preview',
    format: 'html',
    fileExtension: 'html'
  }
]
