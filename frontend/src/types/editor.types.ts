import { z } from 'zod'

// ==================== CORE TYPES ====================

export interface ElementSelection {
  readonly element: HTMLElement
  readonly path: string
  readonly tagName: string
  readonly properties: ElementProperties
  readonly metadata: ElementMetadata
}

export interface ElementProperties {
  // Text properties
  readonly textContent?: string
  
  // Color properties
  readonly color: string
  readonly backgroundColor: string
  
  // Typography
  readonly fontSize: string
  readonly fontWeight: string
  readonly fontFamily: string
  readonly lineHeight: string
  readonly textAlign: string
  
  // Layout
  readonly padding: string
  readonly margin: string
  readonly borderRadius: string
  readonly border: string
  readonly width?: string
  readonly height?: string
  
  // Display
  readonly display: string
  readonly position: string
  
  // Raw style for debugging
  readonly rawStyle?: string
}

export interface ElementMetadata {
  readonly isEditable: boolean
  readonly elementType: ElementType
  readonly hasChildren: boolean
  readonly depth: number
  readonly index: number
}

export type ElementType = 'text' | 'container' | 'interactive' | 'media' | 'form'

// ==================== PROPERTY UPDATE TYPES ====================

export interface PropertyUpdateRequest {
  readonly property: keyof ElementProperties
  readonly value: string
  readonly updateType: PropertyUpdateType
  readonly elementPath: string
}

export type PropertyUpdateType = 'style' | 'text' | 'attribute'

export interface PropertyUpdateResult {
  readonly success: boolean
  readonly actualValue?: string
  readonly error?: PropertyUpdateError
  readonly jsxUpdated: boolean
  readonly domUpdated: boolean
}

export interface PropertyUpdateError {
  readonly code: PropertyErrorCode
  readonly message: string
  readonly details?: Record<string, unknown>
}

export type PropertyErrorCode = 
  | 'INVALID_COLOR_VALUE'
  | 'INVALID_SIZE_VALUE' 
  | 'ELEMENT_NOT_FOUND'
  | 'PROPERTY_NOT_SUPPORTED'
  | 'JSX_PARSE_ERROR'
  | 'DOM_UPDATE_FAILED'

// ==================== JSX MODIFICATION TYPES ====================

export interface JSXModificationRequest {
  readonly jsxCode: string
  readonly elementPath: string
  readonly property: keyof ElementProperties
  readonly value: string
  readonly updateType: PropertyUpdateType
}

export interface JSXModificationResult {
  readonly success: boolean
  readonly modifiedCode?: string
  readonly error?: JSXModificationError
  readonly modifications: JSXModification[]
}

export interface JSXModificationError {
  readonly code: JSXErrorCode
  readonly message: string
  readonly line?: number
  readonly column?: number
  readonly details?: Record<string, unknown>
}

export type JSXErrorCode = 
  | 'PARSE_ERROR'
  | 'ELEMENT_NOT_FOUND' 
  | 'STYLE_OBJECT_INVALID'
  | 'GENERATION_ERROR'

export interface JSXModification {
  readonly type: 'style_added' | 'style_updated' | 'text_updated'
  readonly elementPath: string
  readonly property: string
  readonly oldValue?: string
  readonly newValue: string
}

// ==================== VALIDATION SCHEMAS ====================

export const ColorValueSchema = z.union([
  z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  z.string().regex(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, 'Invalid RGB color'),
  z.string().regex(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([01]?\.?\d*)\s*\)$/, 'Invalid RGBA color'),
  z.enum(['transparent', 'inherit', 'initial', 'unset']),
  z.string().regex(/^[a-zA-Z]+$/, 'Invalid color name')
])

export const SizeValueSchema = z.union([
  z.string().regex(/^\d+(\.\d+)?(px|em|rem|%|vh|vw)$/, 'Invalid size value'),
  z.enum(['auto', 'inherit', 'initial', 'unset'])
])

export const PropertyUpdateRequestSchema = z.object({
  property: z.string(),
  value: z.string(),
  updateType: z.enum(['style', 'text', 'attribute']),
  elementPath: z.string().min(1)
})

// ==================== PERFORMANCE MONITORING ====================

export interface PerformanceMetrics {
  readonly operationType: 'property_update' | 'jsx_modification' | 'dom_update'
  readonly startTime: number
  readonly endTime: number
  readonly duration: number
  readonly success: boolean
  readonly elementPath?: string
  readonly property?: string
}

export interface EditorPerformanceTracker {
  track<T>(operation: string, fn: () => T): T
  getMetrics(): PerformanceMetrics[]
  clearMetrics(): void
}

// ==================== LOGGING TYPES ====================

export interface EditorLogEntry {
  readonly timestamp: number
  readonly level: LogLevel
  readonly category: LogCategory
  readonly message: string
  readonly data?: Record<string, unknown>
  readonly error?: Error
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogCategory = 
  | 'property_update'
  | 'jsx_modification' 
  | 'dom_manipulation'
  | 'validation'
  | 'performance'
  | 'user_interaction'

// ==================== EDITOR CONFIG ====================

export interface EditorConfiguration {
  readonly debounceDelay: number
  readonly maxUndoSteps: number
  readonly enablePerformanceTracking: boolean
  readonly enableDetailedLogging: boolean
  readonly validationStrict: boolean
  readonly jsxParseTimeout: number
}

export const DEFAULT_EDITOR_CONFIG: EditorConfiguration = {
  debounceDelay: 300,
  maxUndoSteps: 50,
  enablePerformanceTracking: true,
  enableDetailedLogging: false,
  validationStrict: true,
  jsxParseTimeout: 5000
}

// ==================== ERROR HANDLING ====================

export class EditorError extends Error {
  public readonly code: PropertyErrorCode | JSXErrorCode
  public readonly details?: Record<string, unknown>

  constructor(
    code: PropertyErrorCode | JSXErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'EditorError'
    this.code = code
    this.details = details
  }
}

export class PropertyValidationError extends EditorError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_COLOR_VALUE', message, details)
    this.name = 'PropertyValidationError'
  }
}
