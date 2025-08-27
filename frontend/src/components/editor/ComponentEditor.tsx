import React, { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Code, FileText, Split, Maximize2 } from 'lucide-react'

interface ComponentEditorProps {
  jsxCode: string
  cssCode: string
  language: 'typescript' | 'javascript'
  onJsxCodeChange: (code: string) => void
  onCssCodeChange: (code: string) => void
}

export function ComponentEditor({
  jsxCode,
  cssCode,
  language,
  onJsxCodeChange,
  onCssCodeChange
}: ComponentEditorProps) {
  const [activeEditor, setActiveEditor] = useState<'jsx' | 'css'>('jsx')
  const [layout, setLayout] = useState<'tabs' | 'split'>('tabs')

  const monacoLanguage = language === 'typescript' ? 'typescript' : 'javascript'

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    wordWrap: 'on' as const,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    padding: { top: 16 },
    theme: 'vs-dark',
    tabSize: 2,
    insertSpaces: true,
  }

  if (layout === 'split') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h3 className="text-sm font-medium text-gray-900">Code Editor</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Language:</span>
              <span className="text-xs font-medium text-blue-600 capitalize">{language}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLayout('tabs')}
              className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              <FileText className="w-3 h-3 mr-1" />
              Tabs
            </button>
            <div className="w-px h-4 bg-gray-300" />
            <button className="flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded">
              <Split className="w-3 h-3 mr-1" />
              Split
            </button>
          </div>
        </div>

        {/* Split View */}
        <div className="flex h-96">
          {/* JSX Editor */}
          <div className="flex-1 border-r border-gray-200">
            <div className="px-3 py-2 bg-gray-800 text-white text-xs font-medium flex items-center">
              <Code className="w-3 h-3 mr-1" />
              Component.{language === 'typescript' ? 'tsx' : 'jsx'}
            </div>
            <Editor
              height="100%"
              language={monacoLanguage}
              value={jsxCode}
              onChange={(value) => onJsxCodeChange(value || '')}
              options={editorOptions}
            />
          </div>

          {/* CSS Editor */}
          <div className="flex-1">
            <div className="px-3 py-2 bg-gray-800 text-white text-xs font-medium flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              styles.css
            </div>
            <Editor
              height="100%"
              language="css"
              value={cssCode}
              onChange={(value) => onCssCodeChange(value || '')}
              options={editorOptions}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium text-gray-900">Code Editor</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Language:</span>
            <span className="text-xs font-medium text-blue-600 capitalize">{language}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded">
            <FileText className="w-3 h-3 mr-1" />
            Tabs
          </button>
          <div className="w-px h-4 bg-gray-300" />
          <button
            onClick={() => setLayout('split')}
            className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <Split className="w-3 h-3 mr-1" />
            Split
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveEditor('jsx')}
          className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeEditor === 'jsx'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Code className="w-4 h-4 mr-2" />
          Component.{language === 'typescript' ? 'tsx' : 'jsx'}
        </button>
        <button
          onClick={() => setActiveEditor('css')}
          className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeEditor === 'css'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          styles.css
        </button>
      </div>

      {/* Editor Content */}
      <div className="h-96">
        {activeEditor === 'jsx' ? (
          <Editor
            height="100%"
            language={monacoLanguage}
            value={jsxCode}
            onChange={(value) => onJsxCodeChange(value || '')}
            options={editorOptions}
          />
        ) : (
          <Editor
            height="100%"
            language="css"
            value={cssCode}
            onChange={(value) => onCssCodeChange(value || '')}
            options={editorOptions}
          />
        )}
      </div>
    </div>
  )
}
