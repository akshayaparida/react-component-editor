import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'
import {
  JSXModificationRequest,
  JSXModificationResult,
  JSXModificationError,
  JSXModification,
  EditorError
} from '@/types/editor.types'

/**
 * Production-ready JSX AST parser for safe code modifications
 * Replaces fragile regex-based approach with proper AST manipulation
 */
export class JSXParserService {
  private static readonly PARSE_OPTIONS = {
    sourceType: 'module' as const,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
      'jsx',
      'typescript',
      'decorators-legacy',
      'classProperties',
      'asyncGenerators',
      'functionBind',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'dynamicImport',
      'nullishCoalescingOperator',
      'optionalChaining'
    ] as any
  }

  /**
   * Safely modify JSX code using AST manipulation
   */
  public static async modifyJSX(request: JSXModificationRequest): Promise<JSXModificationResult> {
    try {
      // Parse JSX code to AST
      const ast = this.parseJSX(request.jsxCode)
      
      // Find and modify target element
      const modifications = this.modifyElementProperty(ast, request)
      
      if (modifications.length === 0) {
        return {
          success: false,
          error: {
            code: 'ELEMENT_NOT_FOUND',
            message: `Element at path "${request.elementPath}" not found in JSX`,
            details: { elementPath: request.elementPath }
          },
          modifications: []
        }
      }

      // Generate modified code
      const modifiedCode = generate(ast, {
        retainLines: true,
        compact: false,
        jsescOption: { quotes: 'single' }
      }).code

      return {
        success: true,
        modifiedCode,
        modifications
      }

    } catch (error) {
      return this.handleJSXError(error, request)
    }
  }

  /**
   * Parse JSX code to AST with comprehensive error handling
   */
  private static parseJSX(jsxCode: string): t.File {
    try {
      return parser.parse(jsxCode, this.PARSE_OPTIONS)
    } catch (error: any) {
      throw new EditorError(
        'PARSE_ERROR',
        `Failed to parse JSX: ${error.message}`,
        {
          line: error.loc?.line,
          column: error.loc?.column,
          reasonCode: error.reasonCode
        }
      )
    }
  }

  /**
   * Modify element property in AST
   */
  private static modifyElementProperty(
    ast: t.File, 
    request: JSXModificationRequest
  ): JSXModification[] {
    const modifications: JSXModification[] = []
    let elementIndex = 0
    const targetIndex = this.parseElementPath(request.elementPath)

    traverse(ast, {
      JSXElement(path: any) {
        if (elementIndex === targetIndex) {
          const modification = JSXParserService.applyPropertyModification(path, request)
          if (modification) {
            modifications.push(modification)
          }
        }
        elementIndex++
      }
    })

    return modifications
  }

  /**
   * Apply property modification to JSX element
   */
  private static applyPropertyModification(
    elementPath: any,
    request: JSXModificationRequest
  ): JSXModification | null {
    const { property, value, updateType } = request

    if (updateType === 'text' && property === 'textContent') {
      return this.modifyTextContent(elementPath, value)
    }

    if (updateType === 'style') {
      return this.modifyStyleProperty(elementPath, property, value)
    }

    return null
  }

  /**
   * Modify text content of JSX element
   */
  private static modifyTextContent(elementPath: any, newText: string): JSXModification {
    const element = elementPath.node
    const oldText = this.extractTextContent(element)

    // Replace text content
    if (element.children.length > 0) {
      // Replace existing text
      element.children = [t.jsxText(newText)]
    } else {
      // Add new text
      element.children.push(t.jsxText(newText))
    }

    return {
      type: 'text_updated',
      elementPath: elementPath.node.openingElement.name.name,
      property: 'textContent',
      oldValue: oldText,
      newValue: newText
    }
  }

  /**
   * Modify style property of JSX element
   */
  private static modifyStyleProperty(
    elementPath: any,
    property: string,
    value: string
  ): JSXModification {
    const openingElement = elementPath.node.openingElement
    let styleAttribute = this.findStyleAttribute(openingElement)
    let oldValue: string | undefined

    if (!styleAttribute) {
      // Create new style attribute
      styleAttribute = this.createStyleAttribute(property, value)
      openingElement.attributes.push(styleAttribute)
    } else {
      // Modify existing style attribute
      oldValue = this.updateStyleAttribute(styleAttribute, property, value)
    }

    return {
      type: oldValue ? 'style_updated' : 'style_added',
      elementPath: openingElement.name.name,
      property,
      oldValue,
      newValue: value
    }
  }

  /**
   * Find existing style attribute in JSX element
   */
  private static findStyleAttribute(openingElement: t.JSXOpeningElement): t.JSXAttribute | null {
    return openingElement.attributes.find(
      (attr): attr is t.JSXAttribute => 
        t.isJSXAttribute(attr) && 
        t.isJSXIdentifier(attr.name) && 
        attr.name.name === 'style'
    ) || null
  }

  /**
   * Create new style attribute
   */
  private static createStyleAttribute(property: string, value: string): t.JSXAttribute {
    const styleObject = t.objectExpression([
      t.objectProperty(
        t.identifier(property),
        t.stringLiteral(value)
      )
    ])

    return t.jsxAttribute(
      t.jsxIdentifier('style'),
      t.jsxExpressionContainer(styleObject)
    )
  }

  /**
   * Update existing style attribute
   */
  private static updateStyleAttribute(
    styleAttribute: t.JSXAttribute,
    property: string,
    value: string
  ): string | undefined {
    const expression = styleAttribute.value

    if (!t.isJSXExpressionContainer(expression) || 
        !t.isObjectExpression(expression.expression)) {
      throw new EditorError(
        'STYLE_OBJECT_INVALID',
        'Style attribute must be an object expression'
      )
    }

    const styleObject = expression.expression
    let oldValue: string | undefined

    // Find existing property
    const existingProperty = styleObject.properties.find(
      (prop): prop is t.ObjectProperty => 
        t.isObjectProperty(prop) && 
        t.isIdentifier(prop.key) && 
        prop.key.name === property
    )

    if (existingProperty) {
      // Update existing property
      if (t.isStringLiteral(existingProperty.value)) {
        oldValue = existingProperty.value.value
      }
      existingProperty.value = t.stringLiteral(value)
    } else {
      // Add new property
      styleObject.properties.push(
        t.objectProperty(
          t.identifier(property),
          t.stringLiteral(value)
        )
      )
    }

    return oldValue
  }

  /**
   * Extract text content from JSX element
   */
  private static extractTextContent(element: t.JSXElement): string {
    return element.children
      .filter((child): child is t.JSXText => t.isJSXText(child))
      .map(child => child.value.trim())
      .filter(text => text.length > 0)
      .join(' ')
  }

  /**
   * Parse element path to get target index
   * For now, we use a simple index-based approach
   * In production, this could be enhanced with more sophisticated path parsing
   */
  private static parseElementPath(path: string): number {
    // Simple implementation: extract index from path like "div[0] > h1[0]"
    const matches = path.match(/\[(\d+)\]$/);
    return matches ? parseInt(matches[1], 10) : 0
  }

  /**
   * Handle JSX parsing errors with detailed information
   */
  private static handleJSXError(
    error: any,
    request: JSXModificationRequest
  ): JSXModificationResult {
    const jsxError: JSXModificationError = {
      code: error instanceof EditorError ? error.code as any : 'PARSE_ERROR',
      message: error.message || 'Unknown JSX parsing error',
      line: error.loc?.line,
      column: error.loc?.column,
      details: {
        elementPath: request.elementPath,
        property: request.property,
        value: request.value,
        jsxCodeSample: request.jsxCode.substring(0, 200)
      }
    }

    return {
      success: false,
      error: jsxError,
      modifications: []
    }
  }

  /**
   * Validate JSX code syntax without modifications
   */
  public static validateJSX(jsxCode: string): { valid: boolean; error?: string } {
    try {
      this.parseJSX(jsxCode)
      return { valid: true }
    } catch (error: any) {
      return { 
        valid: false, 
        error: error.message || 'Invalid JSX syntax' 
      }
    }
  }

  /**
   * Extract all element information from JSX for debugging
   */
  public static analyzeJSX(jsxCode: string): Array<{
    tagName: string
    index: number
    hasStyle: boolean
    textContent: string
    path: string
  }> {
    const elements: Array<{
      tagName: string
      index: number
      hasStyle: boolean
      textContent: string
      path: string
    }> = []

    try {
      const ast = this.parseJSX(jsxCode)
      let elementIndex = 0

      traverse(ast, {
        JSXElement(path: any) {
          const element = path.node
          const tagName = t.isJSXIdentifier(element.openingElement.name) 
            ? element.openingElement.name.name 
            : 'unknown'
          
          const hasStyle = JSXParserService.findStyleAttribute(element.openingElement) !== null
          const textContent = JSXParserService.extractTextContent(element)

          elements.push({
            tagName,
            index: elementIndex,
            hasStyle,
            textContent,
            path: `${tagName}[${elementIndex}]`
          })

          elementIndex++
        }
      })
    } catch (error) {
      // Return empty array if parsing fails
    }

    return elements
  }
}
