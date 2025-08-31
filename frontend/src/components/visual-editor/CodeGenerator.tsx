import React, { useMemo, useState } from 'react'
import { Copy, Download, Code } from 'lucide-react'
import { ComponentElement, ComponentState } from './types'
import toast from 'react-hot-toast'

interface CodeGeneratorProps {
  component: ComponentState
  onCopyCode?: () => void
}

export class ComponentCodeGenerator {
  private component: ComponentState
  
  constructor(component: ComponentState) {
    // Validate component state
    if (!component) {
      throw new Error('Component state is required')
    }
    if (!component.name || component.name.trim() === '') {
      throw new Error('Component name is required')
    }
    if (!component.elements) {
      throw new Error('Component elements are required')
    }
    
    this.component = {
      ...component,
      name: component.name.replace(/[^a-zA-Z0-9]/g, ''), // Clean component name
      elements: component.elements || [],
      globalStyles: component.globalStyles || {}
    }
  }

  // Convert CSS-in-JS styles to CSS string
  private stylesToCSS(styles: React.CSSProperties, selector: string = ''): string {
    const cssRules: string[] = []
    
    Object.entries(styles).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert camelCase to kebab-case
        const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        cssRules.push(`  ${cssProperty}: ${value};`)
      }
    })

    if (cssRules.length === 0) return ''
    
    const selectorName = selector || `.${this.component.name.toLowerCase()}`
    return `${selectorName} {\n${cssRules.join('\n')}\n}\n\n`
  }

  // Generate CSS classes from styles
  private generateCSSClasses(): string {
    let css = ''
    
    // Global styles
    if (this.component.globalStyles) {
      css += this.stylesToCSS(this.component.globalStyles, `.${this.component.name.toLowerCase()}`)
    }

    // Element styles
    this.component.elements.forEach((element, index) => {
      const className = `.${this.component.name.toLowerCase()}-element-${index + 1}`
      css += this.stylesToCSS(element.styles, className)
    })

    return css
  }

  // Convert element to JSX
  private elementToJSX(element: ComponentElement, index: number = 0, indent: string = '  '): string {
    const className = `${this.component.name.toLowerCase()}-element-${index + 1}`
    
    switch (element.type) {
      case 'text':
        return `${indent}<span className="${className}">\n${indent}  {${element.content ? `"${element.content}"` : 'children'}}\n${indent}</span>`
      
      case 'button':
        return `${indent}<button className="${className}" onClick={handleClick}>\n${indent}  ${element.content || 'Button'}\n${indent}</button>`
      
      case 'input':
        return `${indent}<input\n${indent}  className="${className}"\n${indent}  type="text"\n${indent}  placeholder="${element.content || 'Enter text...'}"\n${indent}  onChange={handleInputChange}\n${indent}/>`
      
      case 'image':
        return `${indent}<img\n${indent}  className="${className}"\n${indent}  src="${element.content || 'https://via.placeholder.com/200x150'}"\n${indent}  alt="Component image"\n${indent}/>`
      
      case 'flex':
        const flexChildren = element.children?.map((child, childIndex) => 
          this.elementToJSX(child, childIndex, indent + '  ')
        ).join('\n') || ''
        
        return `${indent}<div className="${className}">\n${flexChildren ? flexChildren + '\n' : ''}${indent}</div>`
      
      case 'div':
      case 'container':
      default:
        const children = element.children?.map((child, childIndex) => 
          this.elementToJSX(child, childIndex, indent + '  ')
        ).join('\n') || ''
        
        const content = element.content ? `${indent}  ${element.content}\n` : ''
        
        return `${indent}<div className="${className}">\n${content}${children ? children + '\n' : ''}${indent}</div>`
    }
  }

  // Generate complete React component
  generateReactComponent(): string {
    const componentName = this.component.name
    const hasInteractivity = this.component.elements.some(el => 
      el.type === 'button' || el.type === 'input'
    )

    const jsxElements = this.component.elements.map((element, index) => 
      this.elementToJSX(element, index + 1, '    ')
    ).join('\n')

    const interactivityCode = hasInteractivity ? `
  const handleClick = () => {
    // Add your click handler logic here
    console.log('Button clicked!')
  }

  const handleInputChange = (e) => {
    // Add your input change handler logic here
    console.log('Input changed:', e.target.value)
  }
` : ''

    return `import React from 'react'
import './${componentName}.css'

export default function ${componentName}() {${interactivityCode}
  return (
    <div className="${componentName.toLowerCase()}">
${jsxElements}
    </div>
  )
}`
  }

  // Generate TypeScript version
  generateTypeScriptComponent(): string {
    const componentName = this.component.name
    const hasInteractivity = this.component.elements.some(el => 
      el.type === 'button' || el.type === 'input'
    )

    const jsxElements = this.component.elements.map((element, index) => 
      this.elementToJSX(element, index + 1, '    ')
    ).join('\n')

    const propsInterface = this.component.props && this.component.props.length > 0 
      ? `interface ${componentName}Props {
${this.component.props.map(prop => 
  `  ${prop.name}${prop.type === 'string' ? '?' : ''}: ${prop.type === 'select' ? prop.options?.join(' | ') : prop.type}`
).join('\n')}
}

` : ''

    const interactivityCode = hasInteractivity ? `
  const handleClick = (): void => {
    // Add your click handler logic here
    console.log('Button clicked!')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // Add your input change handler logic here
    console.log('Input changed:', e.target.value)
  }
` : ''

    const propsParam = this.component.props && this.component.props.length > 0 
      ? `props: ${componentName}Props` 
      : ''

    return `import React from 'react'
import './${componentName}.css'

${propsInterface}export default function ${componentName}(${propsParam}) {${interactivityCode}
  return (
    <div className="${componentName.toLowerCase()}">
${jsxElements}
    </div>
  )
}`
  }

  // Generate CSS file
  generateCSS(): string {
    return this.generateCSSClasses()
  }

  // Generate usage example
  generateUsageExample(): string {
    const componentName = this.component.name
    const propsExample = this.component.props && this.component.props.length > 0
      ? '\n  ' + this.component.props.map(prop => 
          `${prop.name}="${prop.defaultValue}"`
        ).join('\n  ') + '\n'
      : ''

    return `import ${componentName} from './${componentName}'

function App() {
  return (
    <div>
      <${componentName}${propsExample}/>
    </div>
  )
}

export default App`
  }
}

export function CodeGenerator({ component, onCopyCode }: CodeGeneratorProps) {
  const [activeCodeTab, setActiveCodeTab] = useState<'react' | 'typescript' | 'css' | 'usage'>('react')
  const [error, setError] = useState<string | null>(null)
  
  const codeGenerator = useMemo(() => {
    try {
      return new ComponentCodeGenerator(component)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize code generator')
      return null
    }
  }, [component])

  const generatedCode = useMemo(() => {
    if (!codeGenerator || error) {
      return `// Error: ${error || 'Code generator not available'}\n// Please check your component configuration`
    }
    
    try {
      switch (activeCodeTab) {
        case 'react':
          return codeGenerator.generateReactComponent()
        case 'typescript':
          return codeGenerator.generateTypeScriptComponent()
        case 'css':
          return codeGenerator.generateCSS()
        case 'usage':
          return codeGenerator.generateUsageExample()
        default:
          return ''
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Code generation failed'
      setError(errorMsg)
      return `// Error: ${errorMsg}\n// Please check your component configuration`
    }
  }, [codeGenerator, activeCodeTab, error])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      toast.success(`${activeCodeTab.toUpperCase()} code copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const handleDownloadCode = () => {
    const fileExtensions = {
      react: 'jsx',
      typescript: 'tsx',
      css: 'css',
      usage: 'jsx'
    }
    
    const fileName = `${component.name}.${fileExtensions[activeCodeTab]}`
    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`${fileName} downloaded!`)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Code Tabs */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Generated Code</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </button>
            <button
              onClick={handleDownloadCode}
              className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </button>
          </div>
        </div>
        
        <div className="flex space-x-1">
          {[
            { id: 'react', label: 'React (.jsx)' },
            { id: 'typescript', label: 'TypeScript (.tsx)' },
            { id: 'css', label: 'CSS' },
            { id: 'usage', label: 'Usage' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCodeTab(tab.id as any)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                activeCodeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-xs font-mono bg-gray-900 text-gray-100 h-full overflow-auto">
          <code>{generatedCode}</code>
        </pre>
      </div>

      {/* Code Stats */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {generatedCode.split('\n').length} lines • {generatedCode.length} characters
          </span>
          <span className="text-green-600">
            ● Live updating
          </span>
        </div>
      </div>
    </div>
  )
}
