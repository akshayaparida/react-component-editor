import React, { useState, useRef, useEffect } from 'react'
import { Copy, Download, Save, FileText, RotateCcw } from 'lucide-react'
import { ComponentState } from './types'
import toast from 'react-hot-toast'

interface SourceCodeEditorProps {
  component: ComponentState
  onSave?: (code: string) => void
  onCodeChange?: (code: string) => void
}

const DEFAULT_COMPONENT_CODE = `import React from 'react'
import './MyComponent.css'

export default function MyComponent() {
  const handleClick = () => {
    console.log('Button clicked!')
  }

  const handleInputChange = (e) => {
    console.log('Input changed:', e.target.value)
  }

  return (
    <div className="mycomponent">
      <div className="mycomponent-element-1">
        Click to edit text
      </div>
    </div>
  )
}`

export function SourceCodeEditor({ 
  component, 
  onSave, 
  onCodeChange 
}: SourceCodeEditorProps) {
  const [code, setCode] = useState(DEFAULT_COMPONENT_CODE)
  const [activeFileTab, setActiveFileTab] = useState<'component' | 'styles' | 'types'>('component')
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [stylesCode, setStylesCode] = useState(`/* ${component.name || 'MyComponent'} Styles */
.mycomponent {
  font-family: Inter, sans-serif;
  font-size: 16px;
  line-height: 1.5;
}

.mycomponent-element-1 {
  padding: 16px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  color: #374151;
  font-family: Inter, sans-serif;
}`)

  const [typesCode, setTypesCode] = useState(`// Type definitions for ${component.name || 'MyComponent'}

export interface ${component.name || 'MyComponent'}Props {
  className?: string
  children?: React.ReactNode
}

export interface ElementStyles {
  padding?: string
  margin?: string
  backgroundColor?: string
  border?: string
  borderRadius?: string
  fontSize?: string
  color?: string
  fontFamily?: string
}`)

  // Initialize code based on component
  useEffect(() => {
    const componentName = component.name || 'MyComponent'
    const initialCode = `import React from 'react'
import './${componentName}.css'

export default function ${componentName}() {
  const handleClick = () => {
    console.log('Button clicked!')
  }

  const handleInputChange = (e) => {
    console.log('Input changed:', e.target.value)
  }

  return (
    <div className="${componentName.toLowerCase()}">
      {/* Add your JSX here */}
      <div className="${componentName.toLowerCase()}-element-1">
        Click to edit text
      </div>
    </div>
  )
}`
    setCode(initialCode)
  }, [component.name])

  const getCurrentCode = () => {
    switch (activeFileTab) {
      case 'component':
        return code
      case 'styles':
        return stylesCode
      case 'types':
        return typesCode
      default:
        return code
    }
  }

  const setCurrentCode = (newCode: string) => {
    switch (activeFileTab) {
      case 'component':
        setCode(newCode)
        break
      case 'styles':
        setStylesCode(newCode)
        break
      case 'types':
        setTypesCode(newCode)
        break
    }
    setIsDirty(true)
    onCodeChange?.(newCode)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setCurrentCode(newCode)
  }

  const handleSave = () => {
    onSave?.(getCurrentCode())
    setIsDirty(false)
    setLastSaved(new Date())
    toast.success(`${activeFileTab} code saved!`)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentCode())
      toast.success(`${activeFileTab} code copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const handleDownloadCode = () => {
    const fileExtensions = {
      component: 'tsx',
      styles: 'css',
      types: 'd.ts'
    }
    
    const componentName = component.name || 'MyComponent'
    const fileName = activeFileTab === 'component' 
      ? `${componentName}.${fileExtensions[activeFileTab]}`
      : activeFileTab === 'styles'
      ? `${componentName}.${fileExtensions[activeFileTab]}`
      : `${componentName}.${fileExtensions[activeFileTab]}`
    
    const blob = new Blob([getCurrentCode()], { type: 'text/plain' })
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

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the code? All changes will be lost.')) {
      const componentName = component.name || 'MyComponent'
      if (activeFileTab === 'component') {
        setCode(DEFAULT_COMPONENT_CODE.replace(/MyComponent/g, componentName).replace(/mycomponent/g, componentName.toLowerCase()))
      } else if (activeFileTab === 'styles') {
        setStylesCode(`/* ${componentName} Styles */\n.${componentName.toLowerCase()} {\n  font-family: Inter, sans-serif;\n}\n`)
      } else if (activeFileTab === 'types') {
        setTypesCode(`// Type definitions for ${componentName}\n\nexport interface ${componentName}Props {\n  className?: string\n}\n`)
      }
      setIsDirty(false)
      toast.success('Code reset to default')
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [getCurrentCode()])

  const currentCode = getCurrentCode()
  const lineCount = currentCode.split('\n').length
  const charCount = currentCode.length

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-medium text-gray-900">Source Code Editor</h3>
            {isDirty && (
              <span className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes"></span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="Reset to default"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </button>
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
            {onSave && (
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className={`flex items-center px-3 py-1 text-xs font-medium rounded transition-colors ${
                  isDirty
                    ? 'text-white bg-blue-600 hover:bg-blue-700'
                    : 'text-gray-500 bg-gray-100 cursor-not-allowed'
                }`}
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </button>
            )}
          </div>
        </div>
        
        {/* File Tabs */}
        <div className="flex space-x-1">
          {[
            { id: 'component', label: `${component.name || 'MyComponent'}.tsx`, icon: '⚛️' },
            { id: 'styles', label: `${component.name || 'MyComponent'}.css`, icon: '🎨' },
            { id: 'types', label: `${component.name || 'MyComponent'}.d.ts`, icon: '📝' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFileTab(tab.id as any)}
              className={`flex items-center px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeFileTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative bg-gray-900">
        {/* Line numbers */}
        <div className="absolute left-0 top-0 w-12 h-full bg-gray-800 border-r border-gray-700 p-2 pointer-events-none">
          <div className="font-mono text-xs text-gray-500 select-none text-right">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} style={{ lineHeight: '1.5', minHeight: '21px' }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        
        {/* Code content */}
        <textarea
          ref={textareaRef}
          value={currentCode}
          onChange={handleCodeChange}
          className="w-full h-full pl-14 pr-4 py-2 font-mono text-sm bg-transparent text-gray-100 border-none outline-none resize-none"
          placeholder={`Write your ${activeFileTab} code here...`}
          spellCheck={false}
          style={{
            tabSize: 2,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            lineHeight: '1.5'
          }}
        />
      </div>

      {/* Editor Footer */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>{lineCount} lines</span>
            <span>{charCount} characters</span>
            <span className="text-blue-600">● {activeFileTab}</span>
          </div>
          <div className="flex items-center space-x-2">
            {lastSaved && (
              <span className="text-green-600">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isDirty && (
              <span className="text-orange-600">● Unsaved changes</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
