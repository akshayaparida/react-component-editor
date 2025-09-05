import { debounce } from 'lodash-es'
import {
  PropertyUpdateRequest,
  PropertyUpdateResult,
  ElementSelection,
  EditorConfiguration,
  DEFAULT_EDITOR_CONFIG,
  JSXModificationRequest
} from '@/types/editor.types'
import { JSXParserService } from './jsx-parser.service'
import { ValidationService } from './validation.service'
import { LoggingService, performanceTracker } from './logging.service'

/**
 * Production-ready property update service
 * Handles DOM updates, JSX modifications, validation, and performance optimization
 */
export class PropertyUpdateService {
  private static instance: PropertyUpdateService
  private config: EditorConfiguration
  private debouncedJSXUpdate: ReturnType<typeof debounce>
  private updateQueue: Map<string, PropertyUpdateRequest> = new Map()
  
  private constructor(config: EditorConfiguration = DEFAULT_EDITOR_CONFIG) {
    this.config = config
    this.debouncedJSXUpdate = debounce(
      this.processJSXUpdates.bind(this),
      config.debounceDelay
    )
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: EditorConfiguration): PropertyUpdateService {
    if (!PropertyUpdateService.instance) {
      PropertyUpdateService.instance = new PropertyUpdateService(config)
    }
    return PropertyUpdateService.instance
  }

  /**
   * Update element property with full production-level handling
   */
  public async updateProperty(
    selectedElement: ElementSelection,
    property: keyof ElementSelection['properties'],
    value: string,
    jsxCode: string,
    onJSXChange: (code: string) => void
  ): Promise<PropertyUpdateResult> {
    return performanceTracker.track('property_update_complete', async () => {
      LoggingService.info('property_update', 'Starting property update', {
        element: selectedElement.tagName,
        property,
        value,
        path: selectedElement.path
      })

      try {
        // 1. Validate request
        const validationResult = this.validateRequest(selectedElement, property, value)
        if (!validationResult.isValid) {
          LoggingService.warn('validation', 'Property update validation failed', {
            errors: validationResult.errors,
            property,
            value
          })
          
          return {
            success: false,
            error: validationResult.errors[0],
            jsxUpdated: false,
            domUpdated: false
          }
        }

        // 2. Update DOM immediately for instant visual feedback
        const domResult = this.updateDOM(selectedElement, property, validationResult.sanitizedValue!)
        if (!domResult.success) {
          LoggingService.error('dom_manipulation', 'DOM update failed', domResult.error, {
            property,
            value
          })
          
          return {
            success: false,
            error: domResult.error!,
            jsxUpdated: false,
            domUpdated: false
          }
        }

        // 3. Queue JSX update (debounced)
        this.queueJSXUpdate(selectedElement, property, validationResult.sanitizedValue!, jsxCode, onJSXChange)

        LoggingService.info('property_update', 'Property update completed successfully', {
          property,
          actualValue: domResult.actualValue
        })

        return {
          success: true,
          actualValue: domResult.actualValue,
          jsxUpdated: false, // Will be updated by debounced function
          domUpdated: true
        }

      } catch (error) {
        LoggingService.error('property_update', 'Unexpected error during property update', error as Error, {
          property,
          value,
          element: selectedElement.tagName
        })

        return {
          success: false,
          error: {
            code: 'DOM_UPDATE_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error'
          },
          jsxUpdated: false,
          domUpdated: false
        }
      }
    })
  }

  /**
   * Validate property update request
   */
  private validateRequest(
    selectedElement: ElementSelection,
    property: keyof ElementSelection['properties'],
    value: string
  ) {
    return performanceTracker.track('validation', () => {
      const request: PropertyUpdateRequest = {
        property,
        value,
        updateType: property === 'textContent' ? 'text' : 'style',
        elementPath: selectedElement.path
      }

      return ValidationService.validatePropertyUpdate(request)
    })
  }

  /**
   * Update DOM with optimized operations
   */
  private updateDOM(
    selectedElement: ElementSelection,
    property: keyof ElementSelection['properties'],
    value: string
  ): { success: boolean; actualValue?: string; error?: any } {
    return performanceTracker.track('dom_update', () => {
      const element = selectedElement.element

      // Validate element is still connected
      if (!element || !element.isConnected) {
        return {
          success: false,
          error: {
            code: 'ELEMENT_NOT_FOUND',
            message: 'Element is no longer connected to DOM'
          }
        }
      }

      try {
        // Handle different property types
        if (property === 'textContent') {
          return this.updateTextContent(element, value)
        } else {
          return this.updateStyleProperty(element, property as string, value)
        }
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'DOM_UPDATE_FAILED',
            message: error instanceof Error ? error.message : 'DOM update failed'
          }
        }
      }
    })
  }

  /**
   * Update text content
   */
  private updateTextContent(element: HTMLElement, value: string): { success: boolean; actualValue: string } {
    const oldText = element.textContent || ''
    element.textContent = value
    
    // Flash visual feedback
    this.flashElement(element)
    
    LoggingService.debug('dom_manipulation', 'Text content updated', {
      oldValue: oldText,
      newValue: value
    })

    return {
      success: true,
      actualValue: value
    }
  }

  /**
   * Update style property
   */
  private updateStyleProperty(
    element: HTMLElement, 
    property: string, 
    value: string
  ): { success: boolean; actualValue: string } {
    const oldValue = getComputedStyle(element)[property as any]
    
    // Apply style with proper handling
    if (property === 'color' || property === 'backgroundColor') {
      element.style[property as any] = value
    } else if (['fontSize', 'padding', 'margin', 'borderRadius'].includes(property)) {
      const finalValue = value.includes('px') ? value : value + 'px'
      element.style[property as any] = finalValue
    } else {
      element.style[property as any] = value
    }

    // Force layout recalculation for certain properties
    if (['padding', 'margin', 'borderRadius'].includes(property)) {
      element.offsetHeight // Force reflow
    }

    // Flash visual feedback
    this.flashElement(element)

    const actualValue = getComputedStyle(element)[property as any]
    
    LoggingService.debug('dom_manipulation', 'Style property updated', {
      property,
      oldValue,
      newValue: value,
      actualValue
    })

    return {
      success: true,
      actualValue
    }
  }

  /**
   * Flash element to provide visual feedback
   */
  private flashElement(element: HTMLElement): void {
    const originalBorder = element.style.border
    element.style.border = '2px solid #10b981'
    
    setTimeout(() => {
      element.style.border = originalBorder
    }, 200)
  }

  /**
   * Queue JSX update for debounced processing
   */
  private queueJSXUpdate(
    selectedElement: ElementSelection,
    property: keyof ElementSelection['properties'],
    value: string,
    jsxCode: string,
    onJSXChange: (code: string) => void
  ): void {
    const key = `${selectedElement.path}_${property}`
    
    this.updateQueue.set(key, {
      property,
      value,
      updateType: property === 'textContent' ? 'text' : 'style',
      elementPath: selectedElement.path
    })

    // Store additional context
    const queueItem = {
      jsxCode,
      onJSXChange,
      selectedElement
    }

    // Use element path as key for context storage
    ;(this.updateQueue as any)[`${key}_context`] = queueItem

    this.debouncedJSXUpdate()
  }

  /**
   * Process queued JSX updates
   */
  private async processJSXUpdates(): Promise<void> {
    if (this.updateQueue.size === 0) return

    LoggingService.info('jsx_modification', 'Processing queued JSX updates', {
      queueSize: this.updateQueue.size
    })

    const updates = Array.from(this.updateQueue.entries())
    this.updateQueue.clear()

    for (const [key, request] of updates) {
      const context = (this.updateQueue as any)[`${key}_context`]
      if (!context) continue

      try {
        await this.processJSXUpdate(request, context.jsxCode, context.onJSXChange)
        delete (this.updateQueue as any)[`${key}_context`]
      } catch (error) {
        LoggingService.error('jsx_modification', 'Failed to process JSX update', error as Error, {
          request,
          key
        })
      }
    }
  }

  /**
   * Process individual JSX update
   */
  private async processJSXUpdate(
    request: PropertyUpdateRequest,
    jsxCode: string,
    onJSXChange: (code: string) => void
  ): Promise<void> {
    return performanceTracker.track('jsx_modification', async () => {
      const jsxRequest: JSXModificationRequest = {
        jsxCode,
        elementPath: request.elementPath,
        property: request.property,
        value: request.value,
        updateType: request.updateType
      }

      const result = await JSXParserService.modifyJSX(jsxRequest)

      if (result.success && result.modifiedCode) {
        onJSXChange(result.modifiedCode)
        
        LoggingService.info('jsx_modification', 'JSX updated successfully', {
          modifications: result.modifications,
          property: request.property
        })
      } else {
        LoggingService.warn('jsx_modification', 'JSX update failed', {
          error: result.error,
          request
        })
      }
    })
  }

  /**
   * Flush all pending updates immediately
   */
  public flushUpdates(): void {
    this.debouncedJSXUpdate.cancel()
    this.processJSXUpdates()
  }

  /**
   * Configure service
   */
  public configure(config: Partial<EditorConfiguration>): void {
    this.config = { ...this.config, ...config }
    
    // Recreate debounced function if delay changed
    if (config.debounceDelay) {
      this.debouncedJSXUpdate.cancel()
      this.debouncedJSXUpdate = debounce(
        this.processJSXUpdates.bind(this),
        config.debounceDelay
      )
    }

    LoggingService.info('property_update', 'Service configuration updated', { config })
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): EditorConfiguration {
    return { ...this.config }
  }

  /**
   * Clear all pending updates
   */
  public clearQueue(): void {
    this.debouncedJSXUpdate.cancel()
    this.updateQueue.clear()
    LoggingService.info('property_update', 'Update queue cleared')
  }

  /**
   * Get queue status for debugging
   */
  public getQueueStatus(): {
    size: number
    isPending: boolean
    items: string[]
  } {
    return {
      size: this.updateQueue.size,
      isPending: (this.debouncedJSXUpdate as any).pending?.() || false,
      items: Array.from(this.updateQueue.keys())
    }
  }
}

// Export singleton instance
export const propertyUpdateService = PropertyUpdateService.getInstance()
