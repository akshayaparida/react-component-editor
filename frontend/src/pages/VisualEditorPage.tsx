import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Code, Eye, MousePointer, Palette, Type, Square, Save, Copy, Share2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { visualComponentsApi } from '@/lib/api'
// @ts-ignore
import * as Babel from '@babel/standalone'

// Default component code for demo
const DEFAULT_COMPONENT = `function MyComponent() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f9ff', 
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif' 
    }}>
      <h1 style={{ 
        color: '#1e40af', 
        fontSize: '24px', 
        marginBottom: '16px' 
      }}>
        Hello World
      </h1>
      <p style={{ 
        color: '#374151', 
        fontSize: '16px',
        lineHeight: '1.5' 
      }}>
        This is a sample React component. Click on any element to edit its properties!
      </p>
      <button style={{
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        marginTop: '16px',
        cursor: 'pointer'
      }}>
        Click Me
      </button>
    </div>
  )
}`

interface SelectedElement {
  element: HTMLElement
  id: string // persistent VE id from data-veid/data-editor-id
  tagName: string
  textContent: string
  styles: {
    color: string
    backgroundColor: string
    fontSize: string
    fontWeight: string
  }
}

export function VisualEditorPage({ testMode = false }: { testMode?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [code, setCode] = useState(DEFAULT_COMPONENT)
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [isSelectMode, setIsSelectMode] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [componentId, setComponentId] = useState<string | null>(null)
  const [componentName, setComponentName] = useState<string>('')
  const [shareUrl, setShareUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [textDraft, setTextDraft] = useState<string>('')
  const previewRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<ReactDOM.Root | null>(null)
  const hasAutoSavedRef = useRef(false)
  const lastSelectedIdRef = useRef<string | null>(null)
  const codeRef = useRef<string>('')

  // Load component from URL if ID is provided
  useEffect(() => {
    if (testMode) return
    const id = searchParams.get('id')
    if (id && id !== componentId) {
      loadComponent(id)
    }
  }, [searchParams, testMode])

  // One-time: ensure code has data-veid anchors for reliable mapping
  useEffect(() => {
    if (!code.includes('data-veid')) {
      const veidized = veidizeCode(code)
      if (veidized !== code) setCode(veidized)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep a ref of current code for debounced updates
  useEffect(() => {
    codeRef.current = code
  }, [code])

  // Auto-save when user first pastes/edits code (one time only)
  useEffect(() => {
    if (testMode) return
    if (code !== DEFAULT_COMPONENT && !hasAutoSavedRef.current && !componentId) {
      hasAutoSavedRef.current = true
      autoSaveComponent()
    }
  }, [code, testMode])

  // Load component by ID
  const loadComponent = async (id: string) => {
    try {
      setIsLoading(true)
      const component = await visualComponentsApi.getById(id)
      
      setCode(component.jsxCode)
      setComponentId(component.id)
      setComponentName(component.name || '')
      setShareUrl(`${window.location.origin}/visual-editor?id=${component.id}`)
      
      console.log('Loaded component:', component.name)
    } catch (error) {
      console.error('Failed to load component:', error)
      alert('Failed to load component. It may not exist or may have been deleted.')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-save component (first time)
  const autoSaveComponent = async () => {
    try {
      const savedComponent = await visualComponentsApi.create({
        name: componentName || `Component_${Date.now()}`,
        jsxCode: code,
        description: 'Created with Visual Editor'
      })
      setComponentId(savedComponent.id)
      setComponentName(savedComponent.name)
      
      // Update URL without navigation
      setSearchParams({ id: savedComponent.id })
      
      // Generate share URL
      const newShareUrl = `${window.location.origin}/visual-editor?id=${savedComponent.id}`
      setShareUrl(newShareUrl)
      
      console.log('Auto-saved component:', savedComponent.id)
    } catch (error) {
      console.error('Failed to auto-save component:', error)
    }
  }

  // Manual save
  const handleSave = async () => {
    if (!componentId) {
      // Create new if no ID exists
      await autoSaveComponent()
      return
    }

    try {
      setIsSaving(true)
      await visualComponentsApi.update(componentId, {
        name: componentName || `Component_${Date.now()}`,
        jsxCode: code
      })
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      
      console.log('Saved component:', componentId)
    } catch (error) {
      console.error('Failed to save component:', error)
      alert('Failed to save component. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  // Copy share URL
  const handleCopyShareUrl = async () => {
    if (!shareUrl) return
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('Share link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy share URL:', err)
    }
  }
  
  // Render component from JSX code
  const renderComponent = () => {
    if (!previewRef.current || !code.trim()) return
    
    setPreviewError(null)
    const container = previewRef.current
    
    try {
      // Optionally sanitize user code: strip import statements to avoid ESM in Function body
      const sanitizeUserCode = (src: string) => {
        // remove bare import lines (preview only)
        let out = src.replace(/^\s*import\s+[^;]+;?\s*$/gm, '')
        return out
      }

      // Persistent veidization of source code for mapping
      const addVeidPlugin = (babel: any) => {
        const t = babel.types
        let counter = 0
        return {
          name: 'add-veid',
          visitor: {
            JSXOpeningElement(path: any) {
              const has = path.node.attributes.some((a: any) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'data-veid' }))
              if (has) return
              const id = `v${Date.now().toString(36)}_${counter++}`
              path.pushContainer('attributes', t.jsxAttribute(t.jsxIdentifier('data-veid'), t.stringLiteral(id)))
            }
          }
        }
      }

      // Apply veidization if missing
      const veidizeIfNeeded = (src: string) => {
        if (src.includes('data-veid')) return src
        const res = (Babel as any).transform(src, {
          filename: 'Component.tsx',
          presets: [["typescript", { isTSX: true, allExtensions: true }]],
          plugins: [addVeidPlugin]
        })
        return res && res.code ? res.code : src
      }

      const instrumentPlugin = (babel: any) => {
        const t = babel.types
        return {
          name: 'visual-editor-instrument',
          visitor: {
            JSXOpeningElement(path: any) {
              // copy persistent data-veid from source into preview-only data-editor-id
              const veidAttr = path.node.attributes.find((attr: any) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'data-veid' }))
              if (!veidAttr) return
              const valNode = (veidAttr as any).value
              const idValue = t.isStringLiteral(valNode) ? valNode : (t.isJSXExpressionContainer(valNode) && t.isStringLiteral(valNode.expression) ? valNode.expression : null)
              if (!idValue) return
              // remove any existing data-editor-id
              path.node.attributes = path.node.attributes.filter((attr: any) => !(t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'data-editor-id' })))
              path.pushContainer('attributes', t.jsxAttribute(t.jsxIdentifier('data-editor-id'), idValue))
            }
          }
        }
      }

      // Ensure code has persistent veids before preview so data-editor-id can mirror them
      const input = sanitizeUserCode(veidizeIfNeeded(code))
      const transformed = Babel.transform(input, {
        filename: 'Component.tsx',
        // Use classic runtime to avoid importing react/jsx-runtime in the output
        presets: [['react', { runtime: 'classic', development: false }], 'typescript'],
        plugins: [instrumentPlugin]
      })
      
      
      if (!transformed.code) throw new Error('Failed to transform code')
      
      // Execute component
      const exports: any = {}
      const require = (name: string) => {
        if (name === 'react') return React
        throw new Error(`Module not found: ${name}`)
      }
      
      // If the user didn't export the component, try to set exports.default
      const execCode = transformed.code +
        "\n; if (typeof exports.default === 'undefined') { try { if (typeof MyComponent !== 'undefined') { exports.default = MyComponent; } else if (typeof Component !== 'undefined') { exports.default = Component; } } catch (e) {} }";
      const func = new Function('exports', 'require', 'React', execCode)
      func(exports, require, React)
      
      const Component = exports.default || exports[Object.keys(exports)[0]]
      if (!Component) throw new Error('No component exported')
      
      // Render component (persist single root to avoid remount churn)
      if (!rootRef.current) {
        rootRef.current = ReactDOM.createRoot(container)
      }
      rootRef.current.render(React.createElement(Component))

      // Reselect previously selected element if possible
      if (lastSelectedIdRef.current) {
        requestAnimationFrame(() => {
          const el = container.querySelector(`[data-editor-id="${lastSelectedIdRef.current}"]`) as HTMLElement | null
          if (el) {
            const styles = extractStyles(el)
            const textContent = el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE 
              ? el.textContent || '' : ''
            setSelectedElement({
              element: el,
              id: lastSelectedIdRef.current!,
              tagName: el.tagName.toLowerCase(),
              textContent,
              styles
            })
            el.classList.add('visual-editor-selected')
          }
        })
      }
      
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to render component')
      console.error('Render error:', err)
    }
  }
  
  // Re-render when code changes
  useEffect(() => {
    const timeoutId = setTimeout(renderComponent, 300)
    return () => clearTimeout(timeoutId)
  }, [code])

  // Test seam: preselect a fake element to show properties panel in test mode
  useEffect(() => {
    if (!testMode || selectedElement) return
    const el = document.createElement('h1')
    el.textContent = 'Hello World'
    const styles = {
      color: '#000000',
      backgroundColor: '#ffffff',
      fontSize: '24px',
      fontWeight: '400',
      padding: '0px',
      margin: '0px',
      borderRadius: '0px',
    } as any
    setSelectedElement({ element: el as any, id: 'test-veid', tagName: 'h1', textContent: 'Hello World', styles })
    setTextDraft('Hello World')
  }, [testMode])
  
  
  // Get element path for identification
  const getElementPath = (element: HTMLElement): string => {
    const path: string[] = []
    let current = element
    
    while (current && current !== previewRef.current) {
      const parent = current.parentElement
      if (parent) {
        const siblings = Array.from(parent.children)
        const index = siblings.indexOf(current)
        path.unshift(`${current.tagName.toLowerCase()}[${index}]`)
      }
      current = parent!
    }
    
    return path.join(' > ')
  }

  // Extract styles from element
  const extractStyles = (element: HTMLElement): Record<string, string> => {
    const computed = window.getComputedStyle(element)
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      padding: computed.padding,
      margin: computed.margin,
      borderRadius: computed.borderRadius,
    }
  }


  // Utility: veidize source (used for header button and mount)
  const veidizeCode = (src: string): string => {
    try {
      const addVeid = (babel: any) => ({
        name: 'add-veid',
        visitor: {
          JSXOpeningElement(path: any) {
            const t = babel.types
            const has = path.node.attributes.some((a: any) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'data-veid' }))
            if (has) return
            const id = `v${Date.now().toString(36)}_${Math.floor(Math.random()*1e6).toString(36)}`
            path.pushContainer('attributes', t.jsxAttribute(t.jsxIdentifier('data-veid'), t.stringLiteral(id)))
          }
        }
      })
      const res = (Babel as any).transform(src, {
        filename: 'Component.tsx',
        presets: [["typescript", { isTSX: true, allExtensions: true }]],
        plugins: [addVeid]
      })
      return res && res.code ? res.code : src
    } catch {
      return src
    }
  }

  // Legacy string update (unused now, kept for reference)
  const updateJSXCode = (jsxCode: string, elementSelector: string, property: string, value: string): string => {
    let updatedCode = jsxCode
    
    if (property === 'textContent') {
      // Update text content between tags
      const tagRegex = new RegExp(`(<${elementSelector}[^>]*>)([^<]*)(</)`)
      updatedCode = updatedCode.replace(tagRegex, `$1${value}$3`)
    } else {
      // Update style properties
      const styleRegex = /style={{([^}]*)}}/ 
      if (updatedCode.match(styleRegex)) {
        // Update existing style
        updatedCode = updatedCode.replace(styleRegex, (match, styles) => {
          const styleObj = parseStyleString(styles)
          styleObj[property] = value
          return `style={{${stringifyStyleObject(styleObj)}}}`
        })
      } else {
        // Add style attribute
        const elementRegex = new RegExp(`(<${elementSelector}[^>]*)(>)`)
        updatedCode = updatedCode.replace(elementRegex, `$1 style={{${property}: '${value}'}}$2`)
      }
    }
    
    return updatedCode
  }
  
  // Helper to parse style string to object
  const parseStyleString = (styleStr: string): Record<string, string> => {
    const styles: Record<string, string> = {}
    styleStr.split(',').forEach(style => {
      const [key, value] = style.split(':').map(s => s.trim().replace(/['"`]/g, ''))
      if (key && value) styles[key] = value
    })
    return styles
  }
  
  // Helper to stringify style object
  const stringifyStyleObject = (styleObj: Record<string, string>): string => {
    return Object.entries(styleObj)
      .map(([key, value]) => `${key}: '${value}'`)
      .join(', ')
  }

  // Handle element selection
  useEffect(() => {
    if (!isSelectMode || !previewRef.current) return

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (!target || !previewRef.current?.contains(target)) return

      e.preventDefault()
      e.stopPropagation()

      const element = (target.closest('[data-editor-id]') as HTMLElement) || target
      const veid = element.getAttribute('data-editor-id') || ''
      const styles = extractStyles(element)
      const textContent = element.childNodes.length === 1 && 
                          element.childNodes[0].nodeType === Node.TEXT_NODE 
                          ? element.textContent || '' 
                          : ''

      setSelectedElement({
        element,
        id: veid,
        tagName: element.tagName.toLowerCase(),
        textContent,
        styles
      })
      setTextDraft(textContent)
      lastSelectedIdRef.current = veid

      // Visual selection feedback
      document.querySelectorAll('.visual-editor-selected').forEach(el => 
        el.classList.remove('visual-editor-selected'))
      element.classList.add('visual-editor-selected')
    }

    const container = previewRef.current
    container.addEventListener('click', handleClick)

    return () => {
      container.removeEventListener('click', handleClick)
    }
  }, [isSelectMode])

  // Lookup mutate by persistent veid id
  const mutateCodeByVeid = (src: string, veid: string, property: string, value: string): string => {
    let updated = false
    const plugin = (babel: any) => {
      const t = babel.types
      const applyStyle = (openingEl: any, key: string, val: string) => {
        let styleAttr = openingEl.attributes.find((attr: any) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'style' }))
        if (!styleAttr) {
          styleAttr = t.jsxAttribute(
            t.jsxIdentifier('style'),
            t.jsxExpressionContainer(t.objectExpression([]))
          )
          openingEl.attributes.push(styleAttr)
        }
        if (!styleAttr.value || !t.isJSXExpressionContainer(styleAttr.value) || !t.isObjectExpression(styleAttr.value.expression)) {
          styleAttr.value = t.jsxExpressionContainer(t.objectExpression([]))
        }
        const obj = styleAttr.value.expression
        const existing = obj.properties.find((p: any) => t.isObjectProperty(p) && t.isIdentifier(p.key, { name: key }))
        if (existing) (existing as any).value = t.stringLiteral(val)
        else obj.properties.push(t.objectProperty(t.identifier(key), t.stringLiteral(val)))
      }
      const setText = (jsxEl: any, text: string) => {
        const tnode = t.jsxText(text)
        const idx = jsxEl.children.findIndex((c: any) => t.isJSXText(c))
        if (idx >= 0) jsxEl.children[idx] = tnode
        else jsxEl.children.unshift(tnode)
      }
      return {
        name: 'mutate-by-veid',
        visitor: {
          JSXOpeningElement(path: any) {
            if (updated) return
            const attr = path.node.attributes.find((a: any) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'data-veid' }))
            if (!attr) return
            const valNode = (attr as any).value
            const id = t.isStringLiteral(valNode) ? valNode.value : (t.isJSXExpressionContainer(valNode) && t.isStringLiteral(valNode.expression) ? valNode.expression.value : null)
            if (id !== veid) return

            const parentEl = path.parentPath && path.parentPath.node
            if (property === 'textContent') {
              if (parentEl && babel.types.isJSXElement(parentEl)) {
                setText(parentEl, value)
                updated = true
                path.stop()
              }
            } else {
              applyStyle(path.node, property, value)
              updated = true
              path.stop()
            }
          }
        }
      }
    }
    try {
      const result = (Babel as any).transform(src, {
        filename: 'Component.tsx',
        presets: [["typescript", { isTSX: true, allExtensions: true }]],
        plugins: [plugin]
      })
      if (updated && result && result.code) return result.code
      return src
    } catch (e) {
      console.error('mutate by veid failed', e)
      return src
    }
  }

  // Mutate JSX code at a given element path (indices) for the given property
  const mutateCodeAtPath = (src: string, indices: number[], property: string, value: string): string => {
    let updated = false
    const mutatePlugin = (babel: any) => {
      const t = babel.types
      const applyStyle = (openingEl: any, key: string, val: string) => {
        let styleAttr = openingEl.attributes.find((attr: any) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'style' }))
        if (!styleAttr) {
          styleAttr = t.jsxAttribute(
            t.jsxIdentifier('style'),
            t.jsxExpressionContainer(t.objectExpression([]))
          )
          openingEl.attributes.push(styleAttr)
        }
        if (!styleAttr.value || !t.isJSXExpressionContainer(styleAttr.value) || !t.isObjectExpression(styleAttr.value.expression)) {
          styleAttr.value = t.jsxExpressionContainer(t.objectExpression([]))
        }
        const obj = styleAttr.value.expression
        const existing = obj.properties.find((p: any) => t.isObjectProperty(p) && t.isIdentifier(p.key, { name: key }))
        if (existing) {
          ;(existing as any).value = t.stringLiteral(val)
        } else {
          obj.properties.push(t.objectProperty(t.identifier(key), t.stringLiteral(val)))
        }
      }
      const setTextContent = (jsxEl: any, text: string) => {
        const newText = t.jsxText(text)
        const existingIndex = jsxEl.children.findIndex((c: any) => t.isJSXText(c))
        if (existingIndex >= 0) jsxEl.children[existingIndex] = newText
        else jsxEl.children.unshift(newText)
      }
      const descend = (node: any, depth: number): any => {
        if (!node) return null
        if (!(t.isJSXElement(node) || t.isJSXFragment(node))) return null
        if (depth === indices.length) return node
        const childElements = node.children.filter((c: any) => t.isJSXElement(c) || t.isJSXFragment(c))
        const idx = indices[depth]
        if (idx < 0 || idx >= childElements.length) return null
        return descend(childElements[idx], depth + 1)
      }
      const updateFromRoot = (rootNode: any) => {
        const target = descend(rootNode, 0)
        if (target) {
          if (property === 'textContent') setTextContent(target, value)
          else if (t.isJSXElement(target)) applyStyle(target.openingElement, property, value)
          updated = true
        }
      }
      return {
        name: 'mutate-prop',
        visitor: {
          ReturnStatement(path: any) {
            if (updated) return
            const arg = path.node.argument
            if (arg && (t.isJSXElement(arg) || t.isJSXFragment(arg))) {
              updateFromRoot(arg)
              if (updated) path.stop()
            }
          },
          ArrowFunctionExpression(path: any) {
            if (updated) return
            const body = path.node.body
            if (t.isJSXElement(body) || t.isJSXFragment(body)) {
              updateFromRoot(body)
              if (updated) path.stop()
            }
          }
        }
      }
    }
    try {
      const result = (Babel as any).transform(src, {
        filename: 'Component.tsx',
        // Use only typescript preset (keeps JSX), do not transform JSX to createElement
        presets: [["typescript", { isTSX: true, allExtensions: true }]],
        plugins: [mutatePlugin]
      })
      if (updated && result && result.code) return result.code
      return src
    } catch (err) {
      console.error('AST mutate failed:', err)
      return src
    }
  }

  // Debounced code mutation to keep typing smooth
  const debouncedUpdateRef = useRef<number | null>(null)
  const scheduleCodeUpdate = (veid: string, property: string, value: string) => {
    if (debouncedUpdateRef.current) window.clearTimeout(debouncedUpdateRef.current)
    debouncedUpdateRef.current = window.setTimeout(() => {
      const base = codeRef.current
      const next = mutateCodeByVeid(base, veid, property, value)
      lastSelectedIdRef.current = veid
      if (next !== base) setCode(next)
    }, 150)
  }

  const handlePropertyChange = (property: string, rawValue: string) => {
    if (!selectedElement) return
    let value = rawValue
    if (['fontSize', 'padding', 'borderRadius'].includes(property)) {
      if (value && /^\d+$/.test(value)) value = `${value}px`
    }

    // Optimistic DOM update for instant feedback
    if (property === 'textContent') {
      setTextDraft(value)
      try { selectedElement.element.textContent = value } catch {}
      setSelectedElement(prev => prev ? { ...prev, textContent: value } : prev)
      scheduleCodeUpdate(selectedElement.id, 'textContent', value)
    } else {
      try { (selectedElement.element.style as any)[property] = value } catch {}
      setSelectedElement(prev => prev ? { ...prev, styles: { ...prev.styles, [property]: value } as any } : prev)
      scheduleCodeUpdate(selectedElement.id, property, value)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading component...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-gray-900">Visual Component Editor</h1>
                {componentId && (
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="text"
                      value={componentName}
                      onChange={(e) => setComponentName(e.target.value)}
                      placeholder="Component name"
                      className="text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                    />
                    <span className="text-xs text-gray-400">ID: {componentId.slice(0, 8)}...</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsSelectMode(!isSelectMode)}
                className={`flex items-center px-3 py-1 text-sm rounded transition-colors ${
                  isSelectMode 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <MousePointer className="w-4 h-4 mr-2" />
                Select Mode {isSelectMode ? 'ON' : 'OFF'}
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              {shareUrl && (
                <button
                  onClick={handleCopyShareUrl}
                  className="flex items-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  saveSuccess
                    ? 'bg-green-100 text-green-700'
                    : isSaving
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
              </button>
              <button
                onClick={() => setCode(veidizeCode(code))}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
              >
                Veidize
              </button>
              <button
                onClick={handleCopyCode}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  copySuccess 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Copy className="w-4 h-4 mr-2" />
                {copySuccess ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Left: Code Editor */}
          <div className="col-span-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900">React Component Code</h3>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[calc(100%-40px)] p-4 font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
              placeholder="Paste your React component code here..."
            />
          </div>

          {/* Right: Preview + Properties */}
          <div className="col-span-6 space-y-6">
            {/* Preview */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-900">Live Preview</h3>
                </div>
                {selectedElement && (
                  <div className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {selectedElement.tagName} selected
                  </div>
                )}
              </div>
              <div 
                ref={previewRef}
                data-testid={testMode ? 'preview' : undefined}
                className={`p-6 min-h-[300px] ${isSelectMode ? 'cursor-crosshair' : 'cursor-default'}`}
              >
                {previewError && (
                  <div className="text-sm text-red-600">{previewError}</div>
                )}
              </div>
            </div>

            {/* Properties Panel */}
            {selectedElement && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <Palette className="w-4 h-4 mr-2" />
                    Properties: {selectedElement.tagName}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{selectedElement.path}</p>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Text Content */}
                  {selectedElement.textContent && (
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Type className="w-4 h-4 mr-2" />
                        Text Content
                      </label>
                      <input
                        type="text"
                        value={textDraft}
                        onChange={(e) => handlePropertyChange('textContent', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* Color */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Square className="w-4 h-4 mr-2" />
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={selectedElement.styles.color || '#000000'}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={selectedElement.styles.backgroundColor || '#ffffff'}
                      onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Font Size
                    </label>
                    <input
                      type="text"
                      value={selectedElement.styles.fontSize || ''}
                      onChange={(e) => handlePropertyChange('fontSize', e.target.value)}
                      placeholder="e.g. 16px"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Font Weight */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Font Weight
                    </label>
                    <select
                      value={selectedElement.styles.fontWeight || '400'}
                      onChange={(e) => handlePropertyChange('fontWeight', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semibold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra Bold (800)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for selection highlight */}
      <style>{`
        .visual-editor-selected {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }
      `}</style>
    </div>
  )
}
