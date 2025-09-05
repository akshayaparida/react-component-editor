import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
// @ts-ignore - runtime transpilation
import * as Babel from '@babel/standalone'

export type SelectedElement = {
  rcid: number
  tagName: string
  id?: string
  className?: string
  text?: string
  style?: string
}

interface InteractivePreviewProps {
  jsxCode: string
  cssCode: string
  onSelect: (sel: SelectedElement | null) => void
  selectedId?: number | null
}

export function InteractivePreview({ jsxCode, cssCode, onSelect, selectedId }: InteractivePreviewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<ReactDOM.Root | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Inject rcid data attributes at runtime for mapping DOM nodes
  function rcidInstrumentationPlugin(babel: any) {
    const t = babel.types
    let counter = 0
    return {
      visitor: {
        JSXElement(path: any) {
          counter += 1
          const attr = t.jsxAttribute(
            t.jsxIdentifier('data-rcid'),
            t.stringLiteral(String(counter))
          )
          const attrs = path.node.openingElement.attributes
          const hasAlready = attrs.some((a: any) => a.name && a.name.name === 'data-rcid')
          if (!hasAlready) {
            attrs.push(attr)
          }
        }
      }
    }
  }

  // Render the component from source
  useEffect(() => {
    setError(null)

    const container = mountRef.current
    if (!container) return

    // Clear previous selection outline
    try {
      const prevSel = container.querySelector('[data-rcid].__selected') as HTMLElement | null
      if (prevSel) prevSel.classList.remove('__selected')
    } catch {}

    // Reset mount
    container.innerHTML = ''
    if (rootRef.current) {
      try { rootRef.current.unmount() } catch {}
      rootRef.current = null
    }

    try {
      const plugins = [rcidInstrumentationPlugin, 'transform-modules-commonjs']
      const presets = ['react', 'typescript']
      const transformed = Babel.transform(jsxCode, { presets, plugins })
      const code = transformed.code || ''

      const module = { exports: {} as any }
      // eslint-disable-next-line no-new-func
      const fn = new Function('React', 'module', 'exports', code + '\nreturn module.exports;')
      const mod = fn(React, module, (module as any).exports)
      const Comp = (mod && (mod.default || mod)) as React.ComponentType<any>

      const root = ReactDOM.createRoot(container)
      rootRef.current = root
      root.render(React.createElement(Comp))

      // Attach click handler for selection
      const clickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target) return
        const el = target.closest('[data-rcid]') as HTMLElement | null
        if (!el) {
          onSelect(null)
          return
        }
        e.preventDefault()
        e.stopPropagation()

        // Mark selection
        container.querySelectorAll('[data-rcid].__selected').forEach((n) => n.classList.remove('__selected'))
        el.classList.add('__selected')

        const rcid = Number(el.dataset.rcid)
        const sel = {
          rcid,
          tagName: el.tagName.toLowerCase(),
          id: el.id || undefined,
          className: el.getAttribute('class') || undefined,
          text: el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE
            ? (el.textContent || '').trim()
            : undefined,
          style: el.getAttribute('style') || undefined,
        }
        onSelect(sel)
      }

      container.addEventListener('click', clickHandler)
      return () => {
        container.removeEventListener('click', clickHandler)
        try { root.unmount() } catch {}
      }
    } catch (err: any) {
      console.error('Preview render error:', err)
      setError(err?.message || 'Failed to render preview')
    }
  }, [jsxCode])

  // Re-apply selection highlight when selectedId changes
  useEffect(() => {
    const container = mountRef.current
    if (!container) return
    container.querySelectorAll('[data-rcid].__selected').forEach((n) => n.classList.remove('__selected'))
    if (selectedId) {
      const el = container.querySelector(`[data-rcid="${selectedId}"]`) as HTMLElement | null
      if (el) el.classList.add('__selected')
    }
  }, [selectedId])

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-900">Interactive Preview</div>
        <div className="text-xs text-gray-500">Click any element to edit its properties</div>
      </div>
      <div className="h-96 overflow-auto relative">
        {error ? (
          <div className="p-6 text-red-600 text-sm">{error}</div>
        ) : (
          <div ref={mountRef} className="p-4">
            {/* Render target */}
          </div>
        )}
        {/* Embedded CSS */}
        {cssCode && <style dangerouslySetInnerHTML={{ __html: cssCode + '\n[data-rcid].__selected { outline: 2px solid #3b82f6; outline-offset: 2px; }' }} />}
      </div>
    </div>
  )
}

