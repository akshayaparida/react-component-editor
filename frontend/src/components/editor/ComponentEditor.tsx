import React from 'react'
import Editor from '@monaco-editor/react'

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
  // Auto-detect language based on code content
  const detectLanguage = (code: string) => {
    if (code.includes('interface ') || code.includes('type ') || code.includes(': React.') || code.includes('<T>')) {
      return 'typescript'
    }
    return 'javascript'
  }

  const autoDetectedLanguage = detectLanguage(jsxCode)
  const monacoLanguage = autoDetectedLanguage === 'typescript' ? 'typescript' : 'javascript'

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    wordWrap: 'on' as const,
    automaticLayout: true,
    scrollBeyondLastLine: true,
    scrollbar: {
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      verticalScrollbarSize: 17,
      horizontalScrollbarSize: 17,
      alwaysConsumeMouseWheel: false
    },
    padding: { top: 16 },
    theme: 'vs-dark',
    tabSize: 2,
    insertSpaces: true,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium text-gray-900">React Component Editor</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Auto-detected:</span>
            <span className="text-xs font-medium text-blue-600 capitalize">
              {autoDetectedLanguage === 'typescript' ? 'TSX' : 'JSX'}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Paste your React component code below
        </div>
      </div>

      {/* Single Editor */}
      <div className="h-[500px]">
        <Editor
          height="100%"
          language={monacoLanguage}
          value={jsxCode}
          onChange={(value) => onJsxCodeChange(value || '')}
          options={editorOptions}
        />
      </div>
    </div>
  )
}
