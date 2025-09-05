import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ValidationService } from '../validation.service'
import { JSXParserService } from '../jsx-parser.service'
import { LoggingService } from '../logging.service'
import type { PropertyUpdateRequest, JSXModificationRequest } from '@/types/editor.types'

// Mock DOM environment
Object.defineProperty(global, 'getComputedStyle', {
  value: () => ({
    color: 'rgb(0, 0, 0)',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    fontSize: '16px',
    padding: '0px',
    borderRadius: '0px'
  })
})

Object.defineProperty(global, 'performance', {
  value: {
    now: () => Date.now()
  }
})

describe('ValidationService', () => {
  describe('validatePropertyUpdate', () => {
    it('should validate valid color values', () => {
      const request: PropertyUpdateRequest = {
        property: 'color',
        value: '#ff0000',
        updateType: 'style',
        elementPath: 'h1[0]'
      }

      const result = ValidationService.validatePropertyUpdate(request)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitizedValue).toBe('#ff0000')
    })

    it('should reject invalid color values', () => {
      const request: PropertyUpdateRequest = {
        property: 'color',
        value: 'invalid-color',
        updateType: 'style',
        elementPath: 'h1[0]'
      }

      const result = ValidationService.validatePropertyUpdate(request)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('should validate and normalize size values', () => {
      const request: PropertyUpdateRequest = {
        property: 'fontSize',
        value: '20',
        updateType: 'style',
        elementPath: 'h1[0]'
      }

      const result = ValidationService.validatePropertyUpdate(request)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitizedValue).toBe('20px')
    })

    it('should validate RGB color values', () => {
      const request: PropertyUpdateRequest = {
        property: 'color',
        value: 'rgb(255, 0, 0)',
        updateType: 'style',
        elementPath: 'h1[0]'
      }

      const result = ValidationService.validatePropertyUpdate(request)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitizedValue).toBe('rgb(255, 0, 0)')
    })
  })

  describe('validateColorContrast', () => {
    it('should calculate contrast ratio', () => {
      const result = ValidationService.validateColorContrast('#000000', '#ffffff')
      
      expect(result.contrastRatio).toBeGreaterThan(4.5)
      expect(result.meetsWCAG_AA).toBe(true)
    })

    it('should identify poor contrast', () => {
      const result = ValidationService.validateColorContrast('#cccccc', '#ffffff')
      
      expect(result.contrastRatio).toBeLessThan(4.5)
      expect(result.meetsWCAG_AA).toBe(false)
    })
  })
})

describe('JSXParserService', () => {
  const sampleJSX = `
    import React from 'react';
    
    export default function TestComponent() {
      return (
        <div className="container">
          <h1>Hello World</h1>
          <p style={{color: '#333'}}>Sample text</p>
          <button>Click me</button>
        </div>
      );
    }
  `

  describe('validateJSX', () => {
    it('should validate correct JSX syntax', () => {
      const result = JSXParserService.validateJSX(sampleJSX)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid JSX syntax', () => {
      const invalidJSX = '<div><h1>Unclosed tag</div>'
      const result = JSXParserService.validateJSX(invalidJSX)
      
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('analyzeJSX', () => {
    it('should extract element information', () => {
      const elements = JSXParserService.analyzeJSX(sampleJSX)
      
      expect(elements).toHaveLength(4) // div, h1, p, button
      expect(elements[0].tagName).toBe('div')
      expect(elements[1].tagName).toBe('h1')
      expect(elements[2].tagName).toBe('p')
      expect(elements[2].hasStyle).toBe(true)
      expect(elements[3].tagName).toBe('button')
    })
  })

  describe('modifyJSX', () => {
    it('should update existing style property', async () => {
      const request: JSXModificationRequest = {
        jsxCode: sampleJSX,
        elementPath: 'p[0]',
        property: 'color',
        value: '#ff0000',
        updateType: 'style'
      }

      const result = await JSXParserService.modifyJSX(request)
      
      expect(result.success).toBe(true)
      expect(result.modifiedCode).toContain('#ff0000')
      expect(result.modifications).toHaveLength(1)
      expect(result.modifications[0].type).toBe('style_updated')
    })

    it('should add new style property', async () => {
      const jsxWithoutStyle = `
        import React from 'react';
        
        export default function TestComponent() {
          return <h1>Hello World</h1>;
        }
      `

      const request: JSXModificationRequest = {
        jsxCode: jsxWithoutStyle,
        elementPath: 'h1[0]',
        property: 'color',
        value: '#ff0000',
        updateType: 'style'
      }

      const result = await JSXParserService.modifyJSX(request)
      
      expect(result.success).toBe(true)
      expect(result.modifiedCode).toContain('style={{color: \'#ff0000\'}}')
      expect(result.modifications).toHaveLength(1)
      expect(result.modifications[0].type).toBe('style_added')
    })

    it('should update text content', async () => {
      const request: JSXModificationRequest = {
        jsxCode: sampleJSX,
        elementPath: 'h1[0]',
        property: 'textContent',
        value: 'New Title',
        updateType: 'text'
      }

      const result = await JSXParserService.modifyJSX(request)
      
      expect(result.success).toBe(true)
      expect(result.modifiedCode).toContain('New Title')
      expect(result.modifications).toHaveLength(1)
      expect(result.modifications[0].type).toBe('text_updated')
    })

    it('should handle element not found', async () => {
      const request: JSXModificationRequest = {
        jsxCode: sampleJSX,
        elementPath: 'nonexistent[99]',
        property: 'color',
        value: '#ff0000',
        updateType: 'style'
      }

      const result = await JSXParserService.modifyJSX(request)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('ELEMENT_NOT_FOUND')
    })
  })
})

describe('LoggingService', () => {
  beforeEach(() => {
    LoggingService.clearLogs()
  })

  it('should log debug messages', () => {
    LoggingService.debug('property_update', 'Test debug message', { key: 'value' })
    
    const logs = LoggingService.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].level).toBe('debug')
    expect(logs[0].category).toBe('property_update')
    expect(logs[0].message).toBe('Test debug message')
  })

  it('should log error messages with error objects', () => {
    const error = new Error('Test error')
    LoggingService.error('validation', 'Test error message', error)
    
    const logs = LoggingService.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].level).toBe('error')
    expect(logs[0].error).toBe(error)
  })

  it('should filter logs by level and category', () => {
    LoggingService.debug('property_update', 'Debug message')
    LoggingService.info('jsx_modification', 'Info message')
    LoggingService.error('validation', 'Error message')
    
    const debugLogs = LoggingService.getLogs(undefined, 'debug')
    expect(debugLogs).toHaveLength(1)
    
    const validationLogs = LoggingService.getLogs(undefined, undefined, 'validation')
    expect(validationLogs).toHaveLength(1)
  })

  it('should export logs as JSON', () => {
    LoggingService.info('validation', 'Test message')
    
    const exportedLogs = LoggingService.exportLogs()
    expect(exportedLogs).toBeTruthy()
    expect(() => JSON.parse(exportedLogs)).not.toThrow()
  })
})

describe('Integration Tests', () => {
  it('should handle complete color update workflow', async () => {
    // This would be a more comprehensive test that verifies:
    // 1. Validation passes
    // 2. JSX is properly modified
    // 3. Logs are created
    // 4. Performance is tracked
    
    const jsxCode = `
      import React from 'react';
      
      export default function TestComponent() {
        return <h1>Hello World</h1>;
      }
    `

    // Validate the property update
    const validationResult = ValidationService.validatePropertyUpdate({
      property: 'color',
      value: '#ff0000',
      updateType: 'style',
      elementPath: 'h1[0]'
    })

    expect(validationResult.isValid).toBe(true)

    // Modify the JSX
    const jsxResult = await JSXParserService.modifyJSX({
      jsxCode,
      elementPath: 'h1[0]',
      property: 'color',
      value: '#ff0000',
      updateType: 'style'
    })

    expect(jsxResult.success).toBe(true)
    expect(jsxResult.modifiedCode).toContain('#ff0000')

    // Verify logging occurred (if we had setup proper mocking)
    // This would require more sophisticated mocking setup
  })
})
