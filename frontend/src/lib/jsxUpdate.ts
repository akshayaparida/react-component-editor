// Utilities to update JSX code by element rcid using a Babel transform
// This is a best-effort updater for simple cases (text, className, id, style)

// @ts-ignore - runtime transpilation utilities
import * as Babel from '@babel/standalone'

export type PropertyUpdates = {
  text?: string
  className?: string
  id?: string
  style?: string // CSS string: key:value; key2:value2
}

function toCamelCase(prop: string) {
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function parseStyle(style?: string): Record<string, string> | null {
  if (!style) return null
  const obj: Record<string, string> = {}
  style.split(';').forEach(rule => {
    const trimmed = rule.trim()
    if (!trimmed) return
    const [k, ...rest] = trimmed.split(':')
    if (!k || rest.length === 0) return
    const key = toCamelCase(k.trim())
    const value = rest.join(':').trim()
    obj[key] = value
  })
  return obj
}

export function updateJsxByRcid(source: string, rcid: number, updates: PropertyUpdates): string {
  let updatedCode = source
  try {
    const plugin = function(babel: any) {
      const t = babel.types
      let counter = 0
      return {
        visitor: {
          JSXElement(path: any) {
            counter += 1
            if (counter !== rcid) return

            // Update attributes: className, id, style
            const opening = path.node.openingElement

            function upsertAttr(name: string, valueNode: any) {
              const attrs = opening.attributes
              let existingIdx = -1
              for (let i = 0; i < attrs.length; i++) {
                const a = attrs[i] as any
                if (a?.name?.name === name) { existingIdx = i; break }
              }
              const jsxAttr = t.jsxAttribute(t.jsxIdentifier(name), valueNode)
              if (existingIdx >= 0) attrs[existingIdx] = jsxAttr
              else attrs.push(jsxAttr)
            }

            if (updates.className !== undefined) {
              upsertAttr('className', t.stringLiteral(updates.className))
            }
            if (updates.id !== undefined) {
              upsertAttr('id', t.stringLiteral(updates.id))
            }
            if (updates.style !== undefined) {
              const styleObj = parseStyle(updates.style) || {}
              const props = Object.entries(styleObj).map(([k, v]) =>
                t.objectProperty(t.identifier(k), t.stringLiteral(v))
              )
              const expr = t.jsxExpressionContainer(t.objectExpression(props))
              upsertAttr('style', expr)
            }

            // Update text content only if element has simple text children
            if (updates.text !== undefined) {
              const hasOnlyText = path.node.children.every((ch: any) => ch.type === 'JSXText' || (ch.type === 'JSXExpressionContainer' && ch.expression.type === 'StringLiteral'))
              if (hasOnlyText) {
                path.node.children = [t.jsxText(updates.text)]
              }
            }
          }
        }
      }
    }

    const result = Babel.transform(source, {
      presets: ['react', 'typescript'],
      plugins: [plugin]
    })

    updatedCode = result.code || source
  } catch (err) {
    console.error('Failed to update JSX by rcid:', err)
  }
  return updatedCode
}

