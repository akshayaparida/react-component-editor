import React, { useState } from 'react'
import { X, Download, Copy, Package, FileText } from 'lucide-react'
import { ComponentState, EXPORT_FORMATS } from './types'
import { ComponentCodeGenerator } from './CodeGenerator'
import toast from 'react-hot-toast'

interface ExportPanelProps {
  component: ComponentState
  onClose: () => void
}

export function ExportPanel({ component, onClose }: ExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState(EXPORT_FORMATS[0])
  const codeGenerator = new ComponentCodeGenerator(component)

  const handleExport = async () => {
    try {
      switch (selectedFormat.format) {
        case 'react-component':
          const reactCode = codeGenerator.generateReactComponent()
          await navigator.clipboard.writeText(reactCode)
          toast.success('React component copied to clipboard!')
          break

        case 'react-tsx':
          const tsxCode = codeGenerator.generateTypeScriptComponent()
          await navigator.clipboard.writeText(tsxCode)
          toast.success('TypeScript component copied to clipboard!')
          break

        case 'css':
          const cssCode = codeGenerator.generateCSS()
          await navigator.clipboard.writeText(cssCode)
          toast.success('CSS styles copied to clipboard!')
          break

        case 'complete-package':
          await downloadCompletePackage()
          break

        case 'html':
          await downloadHTML()
          break
      }
    } catch (error) {
      toast.error('Export failed')
    }
  }

  const downloadCompletePackage = async () => {
    const files = {
      [`${component.name}.tsx`]: codeGenerator.generateTypeScriptComponent(),
      [`${component.name}.css`]: codeGenerator.generateCSS(),
      [`${component.name}.stories.tsx`]: generateStorybookStory(),
      [`README.md`]: generateReadme(),
      [`package.json`]: generatePackageJson()
    }

    // Create a simple zip-like structure (for demo purposes)
    const content = Object.entries(files)
      .map(([filename, content]) => `// ${filename}\n${content}\n\n${'='.repeat(50)}\n`)
      .join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${component.name}-package.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Complete package downloaded!')
  }

  const downloadHTML = async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${component.name} - Preview</title>
  <style>
    ${codeGenerator.generateCSS()}
    body { font-family: Inter, sans-serif; padding: 2rem; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="${component.name.toLowerCase()}">
    ${component.elements.map(element => generateHTMLElement(element)).join('\n    ')}
  </div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${component.name}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('HTML file downloaded!')
  }

  const generateHTMLElement = (element: any): string => {
    const styles = Object.entries(element.styles || {})
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ')

    switch (element.type) {
      case 'text':
        return `<span style="${styles}">${element.content}</span>`
      case 'button':
        return `<button style="${styles}">${element.content}</button>`
      case 'input':
        return `<input type="text" placeholder="${element.content}" style="${styles}" />`
      case 'image':
        return `<img src="${element.content}" style="${styles}" alt="Component image" />`
      default:
        return `<div style="${styles}">${element.content || ''}</div>`
    }
  }

  const generateStorybookStory = () => {
    return `import type { Meta, StoryObj } from '@storybook/react'
import ${component.name} from './${component.name}'

const meta: Meta<typeof ${component.name}> = {
  title: 'Components/${component.name}',
  component: ${component.name},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}`
  }

  const generateReadme = () => {
    return `# ${component.name}

A React component created with Visual Component Builder.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`jsx
import ${component.name} from './${component.name}'

function App() {
  return <${component.name} />
}
\`\`\`

## Props

This component currently accepts no props. Extend as needed.

## Styling

The component comes with its own CSS file. Import it:

\`\`\`jsx
import './${component.name}.css'
\`\`\`
`
  }

  const generatePackageJson = () => {
    return JSON.stringify({
      "name": `@your-org/${component.name.toLowerCase()}`,
      "version": "1.0.0",
      "description": `${component.name} React component`,
      "main": `${component.name}.tsx`,
      "dependencies": {
        "react": "^18.0.0",
        "react-dom": "^18.0.0"
      },
      "devDependencies": {
        "@types/react": "^18.0.0",
        "@types/react-dom": "^18.0.0",
        "typescript": "^4.9.0"
      },
      "keywords": ["react", "component", "ui"],
      "author": "Visual Component Builder",
      "license": "MIT"
    }, null, 2)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Component</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose how you want to export your {component.name} component
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-96">
          {/* Export Options */}
          <div className="grid gap-4">
            {EXPORT_FORMATS.map((format) => {
              const isSelected = selectedFormat.id === format.id
              const icons = {
                'react-component': FileText,
                'react-tsx': FileText,
                'css': Palette,
                'complete-package': Package,
                'html': FileText
              }
              const IconComponent = icons[format.format] || FileText

              return (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format)}
                  className={`flex items-start p-4 border-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 mt-1 mr-3 ${
                    isSelected ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {format.name}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      isSelected ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {format.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="ml-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Preview */}
          {selectedFormat && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
              <div className="bg-gray-900 rounded-lg p-3 max-h-40 overflow-auto">
                <pre className="text-xs text-gray-300">
                  <code>
                    {selectedFormat.format === 'react-component' && codeGenerator.generateReactComponent().slice(0, 300) + '...'}
                    {selectedFormat.format === 'react-tsx' && codeGenerator.generateTypeScriptComponent().slice(0, 300) + '...'}
                    {selectedFormat.format === 'css' && codeGenerator.generateCSS().slice(0, 300) + '...'}
                    {selectedFormat.format === 'complete-package' && 'Multiple files will be packaged together:\n- ' + component.name + '.tsx\n- ' + component.name + '.css\n- README.md\n- package.json\n- Storybook story'}
                    {selectedFormat.format === 'html' && '<!DOCTYPE html>\n<html>\n<head>...\n<body>\n  <!-- Your component as HTML -->\n</body>\n</html>'}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Export format: <span className="font-medium">{selectedFormat.name}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {selectedFormat.format === 'complete-package' || selectedFormat.format === 'html' ? (
                <Download className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {selectedFormat.format === 'complete-package' || selectedFormat.format === 'html' 
                ? 'Download' 
                : 'Copy to Clipboard'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Palette({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zM3 15a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zm6-11a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  )
}
