import {
  ColorValueSchema,
  SizeValueSchema,
  PropertyUpdateRequestSchema,
  EditorError,
  PropertyUpdateRequest,
  PropertyErrorCode
} from '@/types/editor.types'
import { z } from 'zod'

/**
 * Production-ready validation service with comprehensive error handling
 */
export class ValidationService {
  private static readonly CSS_PROPERTY_VALIDATORS = new Map<string, z.ZodSchema>([
    ['color', ColorValueSchema],
    ['backgroundColor', ColorValueSchema],
    ['fontSize', SizeValueSchema],
    ['padding', SizeValueSchema],
    ['margin', SizeValueSchema],
    ['borderRadius', SizeValueSchema],
    ['width', SizeValueSchema],
    ['height', SizeValueSchema],
    ['lineHeight', z.union([
      SizeValueSchema,
      z.string().regex(/^\\d+(\\.\\d+)?$/, 'Invalid line height number')
    ])],
    ['fontWeight', z.union([
      z.enum(['normal', 'bold', 'bolder', 'lighter']),
      z.string().regex(/^[1-9]00$/, 'Font weight must be 100-900')
    ])],
    ['textAlign', z.enum(['left', 'center', 'right', 'justify'])],
    ['display', z.enum(['block', 'inline', 'inline-block', 'flex', 'grid', 'none'])],
    ['position', z.enum(['static', 'relative', 'absolute', 'fixed', 'sticky'])]
  ])

  private static readonly EDITABLE_ELEMENTS = new Set([
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'button', 'a', 'section', 'article', 'header', 'footer',
    'main', 'aside', 'nav', 'ul', 'ol', 'li'
  ])

  /**
   * Validate property update request
   */
  public static validatePropertyUpdate(request: PropertyUpdateRequest): ValidationResult {
    try {
      // Validate request structure
      const validatedRequest = PropertyUpdateRequestSchema.parse(request)
      
      // Validate specific property value
      const propertyValidation = this.validatePropertyValue(
        validatedRequest.property as string,
        validatedRequest.value
      )
      
      if (!propertyValidation.isValid) {
        return {
          isValid: false,
          errors: propertyValidation.errors,
          sanitizedValue: undefined
        }
      }

      // Validate element is editable
      const elementValidation = this.validateElementEditability(request.elementPath)
      if (!elementValidation.isValid) {
        return {
          isValid: false,
          errors: elementValidation.errors,
          sanitizedValue: undefined
        }
      }

      return {
        isValid: true,
        errors: [],
        sanitizedValue: propertyValidation.sanitizedValue
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: this.formatZodErrors(error),
          sanitizedValue: undefined
        }
      }

      return {
        isValid: false,
        errors: [{
          code: 'PROPERTY_NOT_SUPPORTED',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          field: 'general'
        }],
        sanitizedValue: undefined
      }
    }
  }

  /**
   * Validate specific property value
   */
  private static validatePropertyValue(property: string, value: string): PropertyValidationResult {
    const validator = this.CSS_PROPERTY_VALIDATORS.get(property)
    
    if (!validator) {
      return {
        isValid: false,
        errors: [{
          code: 'PROPERTY_NOT_SUPPORTED',
          message: `Property '${property}' is not supported for validation`,
          field: property
        }],
        sanitizedValue: undefined
      }
    }

    try {
      const sanitizedValue = validator.parse(value)
      return {
        isValid: true,
        errors: [],
        sanitizedValue: this.sanitizeValue(property, sanitizedValue)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: this.formatZodErrors(error, property),
          sanitizedValue: undefined
        }
      }

      return {
        isValid: false,
        errors: [{
          code: 'INVALID_COLOR_VALUE',
          message: `Invalid value for ${property}: ${value}`,
          field: property
        }],
        sanitizedValue: undefined
      }
    }
  }

  /**
   * Validate element editability
   */
  private static validateElementEditability(elementPath: string): ValidationResult {
    try {
      // Extract element tag from path
      const tagMatch = elementPath.match(/^([a-zA-Z]+)/);
      if (!tagMatch) {
        return {
          isValid: false,
          errors: [{
            code: 'ELEMENT_NOT_FOUND',
            message: 'Invalid element path format',
            field: 'elementPath'
          }],
          sanitizedValue: undefined
        }
      }

      const tagName = tagMatch[1].toLowerCase()
      
      if (!this.EDITABLE_ELEMENTS.has(tagName)) {
        return {
          isValid: false,
          errors: [{
            code: 'PROPERTY_NOT_SUPPORTED',
            message: `Element '${tagName}' is not editable`,
            field: 'elementPath'
          }],
          sanitizedValue: undefined
        }
      }

      return {
        isValid: true,
        errors: [],
        sanitizedValue: undefined
      }

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'ELEMENT_NOT_FOUND',
          message: 'Failed to validate element path',
          field: 'elementPath'
        }],
        sanitizedValue: undefined
      }
    }
  }

  /**
   * Sanitize and normalize values
   */
  private static sanitizeValue(property: string, value: string): string {
    switch (property) {
      case 'fontSize':
      case 'padding':
      case 'margin':
      case 'borderRadius':
      case 'width':
      case 'height':
        // Ensure size values have units
        if (/^\\d+$/.test(value)) {
          return `${value}px`
        }
        return value

      case 'color':
      case 'backgroundColor':
        // Normalize hex colors to lowercase
        if (value.startsWith('#')) {
          return value.toLowerCase()
        }
        return value

      case 'fontWeight':
        // Normalize font weight
        if (value === 'normal') return '400'
        if (value === 'bold') return '700'
        return value

      default:
        return value
    }
  }

  /**
   * Format Zod errors to validation errors
   */
  private static formatZodErrors(error: z.ZodError, field?: string): ValidationError[] {
    return error.errors.map(err => ({
      code: this.mapZodErrorToCode(err.code),
      message: err.message,
      field: field || err.path.join('.')
    }))
  }

  /**
   * Map Zod error codes to application error codes
   */
  private static mapZodErrorToCode(zodCode: string): PropertyErrorCode {
    switch (zodCode) {
      case 'invalid_string':
      case 'invalid_type':
        return 'INVALID_COLOR_VALUE'
      case 'too_small':
      case 'too_big':
        return 'INVALID_SIZE_VALUE'
      default:
        return 'PROPERTY_NOT_SUPPORTED'
    }
  }

  /**
   * Validate color contrast for accessibility
   */
  public static validateColorContrast(
    foregroundColor: string, 
    backgroundColor: string
  ): ContrastValidationResult {
    try {
      const contrast = this.calculateContrastRatio(foregroundColor, backgroundColor)
      
      return {
        contrastRatio: contrast,
        meetsWCAG_AA: contrast >= 4.5,
        meetsWCAG_AAA: contrast >= 7,
        recommendation: this.getContrastRecommendation(contrast)
      }
    } catch (error) {
      return {
        contrastRatio: 0,
        meetsWCAG_AA: false,
        meetsWCAG_AAA: false,
        recommendation: 'Unable to calculate contrast ratio'
      }
    }
  }

  /**
   * Calculate color contrast ratio (simplified implementation)
   */
  private static calculateContrastRatio(color1: string, color2: string): number {
    // This is a simplified implementation
    // In production, you'd use a proper color contrast library
    const lum1 = this.getRelativeLuminance(color1)
    const lum2 = this.getRelativeLuminance(color2)
    
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  /**
   * Get relative luminance (simplified)
   */
  private static getRelativeLuminance(color: string): number {
    // Simplified calculation - in production, use proper color library
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    
    // Default for non-hex colors
    return 0.5
  }

  /**
   * Get contrast recommendation
   */
  private static getContrastRecommendation(ratio: number): string {
    if (ratio >= 7) return 'Excellent contrast (WCAG AAA)'
    if (ratio >= 4.5) return 'Good contrast (WCAG AA)'
    if (ratio >= 3) return 'Poor contrast - consider darker/lighter colors'
    return 'Very poor contrast - colors are too similar'
  }

  /**
   * Batch validate multiple properties
   */
  public static validateMultipleProperties(
    properties: Array<{ property: string; value: string }>
  ): BatchValidationResult {
    const results: Record<string, PropertyValidationResult> = {}
    let hasErrors = false

    for (const { property, value } of properties) {
      const result = this.validatePropertyValue(property, value)
      results[property] = result
      if (!result.isValid) {
        hasErrors = true
      }
    }

    return {
      isValid: !hasErrors,
      results,
      summary: {
        total: properties.length,
        valid: Object.values(results).filter(r => r.isValid).length,
        invalid: Object.values(results).filter(r => !r.isValid).length
      }
    }
  }
}

// ==================== TYPES ====================

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  sanitizedValue: string | undefined
}

interface PropertyValidationResult {
  isValid: boolean
  errors: ValidationError[]
  sanitizedValue: string | undefined
}

interface ValidationError {
  code: PropertyErrorCode
  message: string
  field: string
}

interface ContrastValidationResult {
  contrastRatio: number
  meetsWCAG_AA: boolean
  meetsWCAG_AAA: boolean
  recommendation: string
}

interface BatchValidationResult {
  isValid: boolean
  results: Record<string, PropertyValidationResult>
  summary: {
    total: number
    valid: number
    invalid: number
  }
}
