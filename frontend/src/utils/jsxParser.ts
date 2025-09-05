interface ElementUpdate {
  path: string
  property: string
  value: string
  type: 'style' | 'text' | 'attribute'
}

/**
 * Parse JSX path and convert to selector for AST traversal
 */
function parseElementPath(path: string): Array<{tag: string, index: number}> {
  // Convert path like "div[0] > p[1] > span[0]" to array of selectors
  return path.split(' > ').map(segment => {
    const match = segment.match(/^(\w+)\[(\d+)\]$/)
    if (match) {
      return { tag: match[1], index: parseInt(match[2]) }
    }
    return { tag: segment, index: 0 }
  })
}

/**
 * Update JSX code with new property values - SIMPLIFIED VERSION
 */
export function updateJSXProperty(
  jsxCode: string,
  elementPath: string,
  property: string,
  value: string,
  updateType: 'style' | 'text' | 'attribute' = 'style'
): string {
  console.log(`[JSXParser] Attempting to update ${property} = ${value} (type: ${updateType})`)
  console.log(`[JSXParser] Element path: ${elementPath}`)
  console.log(`[JSXParser] Original JSX:`, jsxCode.substring(0, 200))
  
  try {
    if (updateType === 'text') {
      // Simple text replacement for h1
      if (elementPath.includes('h1')) {
        const h1Regex = /(<h1[^>]*>)([^<]+)(<\/h1>)/i
        const newJsx = jsxCode.replace(h1Regex, `$1${value}$3`)
        console.log(`[JSXParser] Text updated JSX:`, newJsx.substring(0, 200))
        return newJsx
      }
    } else if (updateType === 'style') {
      // Simple style addition for h1
      if (elementPath.includes('h1') && property === 'color') {
        // Look for existing h1 with style
        if (jsxCode.includes('<h1') && jsxCode.includes('style=')) {
          const styleRegex = /(<h1[^>]*style=\{\{[^}]*)(color:\s*['"][^'"]*['"])?([^}]*\}\}[^>]*>)/i
          const newJsx = jsxCode.replace(styleRegex, `$1color: '${value}'$3`)
          console.log(`[JSXParser] Style updated JSX:`, newJsx.substring(0, 200))
          return newJsx
        } else {
          // Add new style attribute
          const h1Regex = /(<h1[^>]*)(>)/i
          const newJsx = jsxCode.replace(h1Regex, `$1 style={{color: '${value}'}}$2`)
          console.log(`[JSXParser] Style added JSX:`, newJsx.substring(0, 200))
          return newJsx
        }
      }
    }
    
    console.log(`[JSXParser] No changes made`)
    return jsxCode
  } catch (error) {
    console.error('Error updating JSX property:', error)
    return jsxCode
  }
}

/**
 * Update style property in JSX - Simplified approach
 */
function updateStyleProperty(
  jsxCode: string,
  pathSegments: Array<{tag: string, index: number}>,
  property: string,
  value: string
): string {
  // Convert CSS property names to camelCase for React
  const reactProperty = cssPropertyToReactProperty(property)
  const formattedValue = formatStyleValue(property, value)
  
    console.log(`[JSXParser] Updating style: ${property} -> ${reactProperty} = ${formattedValue}`)
    console.log(`[JSXParser] Original JSX:`, jsxCode.substring(0, 300))
  
  // Simple approach: Find the first matching tag and add/update style
  const tag = pathSegments[0]?.tag?.toLowerCase()
  if (!tag) {
    console.log(`[JSXParser] No tag found in path`)
    return jsxCode
  }
  
  // Try to find existing style attribute first
  const existingStyleRegex = new RegExp(`(<${tag}[^>]*\s+style=\{\{)([^}]*?)(\}\}[^>]*>)`, 'i')
  const existingStyleMatch = jsxCode.match(existingStyleRegex)
  
  if (existingStyleMatch) {
    console.log(`[JSXParser] Found existing style:`, existingStyleMatch[2])
    
    // Parse existing styles and update the property
    const existingStyles = existingStyleMatch[2]
    const styleObj = parseInlineStyles(existingStyles)
    styleObj[reactProperty] = formattedValue
    
    const newStyles = Object.entries(styleObj)
      .map(([key, val]) => `${key}: '${val}'`)
      .join(', ')
    
    console.log(`[JSXParser] New combined styles:`, newStyles)
    
    const updatedJsx = jsxCode.replace(existingStyleRegex, `$1${newStyles}$3`)
    console.log(`[JSXParser] Updated JSX:`, updatedJsx)
    return updatedJsx
  } else {
    // No existing style, add new style attribute
    console.log(`[JSXParser] No existing style found, adding new`)
    
    const tagRegex = new RegExp(`(<${tag}[^>]*?)(/?>)`, 'i')
    const tagMatch = jsxCode.match(tagRegex)
    
    if (tagMatch) {
      console.log(`[JSXParser] Found tag to add style to:`, tagMatch[0])
      const updatedJsx = jsxCode.replace(tagRegex, `$1 style={{${reactProperty}: '${formattedValue}'}}$2`)
      console.log(`[JSXParser] Updated JSX:`, updatedJsx)
      return updatedJsx
    } else {
      console.log(`[JSXParser] Could not find tag: ${tag} in JSX`)
      console.log(`[JSXParser] Available content:`, jsxCode.substring(0, 200))
    }
  }
  
  return jsxCode
}

/**
 * Update text content in JSX - Simplified approach
 */
function updateTextContent(
  jsxCode: string,
  pathSegments: Array<{tag: string, index: number}>,
  value: string
): string {
  console.log(`[JSXParser] Updating text content to: "${value}"`)
  console.log(`[JSXParser] Original JSX:`, jsxCode)
  
  const tag = pathSegments[0]?.tag?.toLowerCase()
  if (!tag) {
    console.log(`[JSXParser] No tag found in path`)
    return jsxCode
  }
  
  // Look for content between opening and closing tags
  const contentRegex = new RegExp(`(<${tag}[^>]*>)([^<]*?)(</${tag}>)`, 'i')
  const match = jsxCode.match(contentRegex)
  
  if (match) {
    console.log(`[JSXParser] Found text content: "${match[2]}" -> "${value}"`)
    const updatedJsx = jsxCode.replace(contentRegex, `$1${value}$3`)
    console.log(`[JSXParser] Updated JSX:`, updatedJsx)
    return updatedJsx
  } else {
    console.log(`[JSXParser] Could not find text content for tag: ${tag}`)
    console.log(`[JSXParser] Trying to find any ${tag} tag...`)
    
    // Try to find just the tag pattern
    const tagRegex = new RegExp(`<${tag}[^>]*>`, 'i')
    const tagMatch = jsxCode.match(tagRegex)
    if (tagMatch) {
      console.log(`[JSXParser] Found tag but no closing tag or content:`, tagMatch[0])
    }
  }
  
  console.log(`[JSXParser] No text content changes made`)
  return jsxCode
}

/**
 * Update attribute property in JSX
 */
function updateAttributeProperty(
  jsxCode: string,
  pathSegments: Array<{tag: string, index: number}>,
  property: string,
  value: string
): string {
  if (pathSegments.length === 1) {
    const tag = pathSegments[0].tag
    
    // Look for existing attribute
    const attrRegex = new RegExp(`(<${tag}[^>]*)(${property}=["'][^"']*["'])([^>]*>)`, 'i')
    
    if (attrRegex.test(jsxCode)) {
      // Update existing attribute
      return jsxCode.replace(attrRegex, `$1${property}="${value}"$3`)
    } else {
      // Add new attribute
      const tagRegex = new RegExp(`(<${tag}[^>]*)(>)`, 'i')
      return jsxCode.replace(tagRegex, `$1 ${property}="${value}"$2`)
    }
  }
  
  return jsxCode
}

/**
 * Parse inline styles string to object
 */
function parseInlineStyles(stylesStr: string): Record<string, string> {
  const styles: Record<string, string> = {}
  
  // Match key: value pairs
  const matches = stylesStr.match(/(\w+):\s*['"]([^'"]*)['"]/g)
  
  if (matches) {
    matches.forEach(match => {
      const [, key, value] = match.match(/(\w+):\s*['"]([^'"]*)['"]/!) || []
      if (key && value) {
        styles[key] = value
      }
    })
  }
  
  return styles
}

/**
 * Convert CSS property names to React camelCase
 */
function cssPropertyToReactProperty(cssProperty: string): string {
  return cssProperty.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
}

/**
 * Format style value based on property type
 */
function formatStyleValue(property: string, value: string): string {
  // Handle different CSS properties
  if (property === 'backgroundColor' || property === 'color' || property === 'borderColor') {
    return value
  }
  
  if (property === 'fontSize' || property === 'padding' || property === 'margin') {
    // Add px if numeric value
    if (/^\d+$/.test(value)) {
      return `${value}px`
    }
    return value
  }
  
  return value
}

/**
 * Get element at path for property extraction
 */
export function getElementAtPath(
  rootElement: HTMLElement,
  path: string
): HTMLElement | null {
  try {
    const pathSegments = parseElementPath(path)
    let current = rootElement
    
    for (const segment of pathSegments) {
      const children = Array.from(current.children).filter(
        child => child.tagName.toLowerCase() === segment.tag
      )
      
      if (segment.index < children.length) {
        current = children[segment.index] as HTMLElement
      } else {
        return null
      }
    }
    
    return current
  } catch {
    return null
  }
}
