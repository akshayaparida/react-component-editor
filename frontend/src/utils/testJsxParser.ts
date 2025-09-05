import { updateJSXProperty } from './jsxParser'

// Simple JSX validation function
function isValidJSX(jsxString: string): boolean {
  try {
    // Basic validation - check for balanced tags and proper syntax
    const openTags = jsxString.match(/<\w+[^>]*>/g) || []
    const closeTags = jsxString.match(/<\/\w+>/g) || []
    const selfClosingTags = jsxString.match(/<\w+[^>]*\/>/g) || []
    
    // Simple check: self-closing tags + close tags should roughly match open tags
    const totalOpen = openTags.length
    const totalClosed = closeTags.length + selfClosingTags.length
    
    return Math.abs(totalOpen - totalClosed) <= 1 // Allow some tolerance
  } catch {
    return false
  }
}

// Test cases for JSX parsing
export function testJSXParser() {
  console.log('=== Testing JSX Parser ===')
  
  // Test 1: Simple div with no existing style
  const test1 = `<div>Hello World</div>`
  console.log('\nTest 1 - Add style to simple div:')
  console.log('Input:', test1)
  const result1 = updateJSXProperty(test1, 'div[0]', 'backgroundColor', '#ff0000', 'style')
  console.log('Output:', result1)
  console.log('Success:', result1.includes('backgroundColor'))
  console.log('Valid JSX:', isValidJSX(result1))
  
  // Test 2: Div with existing style (inline object)
  const test2 = `<div style={{color: 'blue'}}>Hello World</div>`
  console.log('\nTest 2 - Update existing style:')
  console.log('Input:', test2)
  const result2 = updateJSXProperty(test2, 'div[0]', 'backgroundColor', '#ff0000', 'style')
  console.log('Output:', result2)
  console.log('Success:', result2.includes('backgroundColor'))
  console.log('Valid JSX:', isValidJSX(result2))
  
  // Test 3: Text content update
  const test3 = `<h1>Hello World</h1>`
  console.log('\nTest 3 - Update text content:')
  console.log('Input:', test3)
  const result3 = updateJSXProperty(test3, 'h1[0]', 'textContent', 'New Text', 'text')
  console.log('Output:', result3)
  console.log('Success:', result3.includes('New Text'))
  console.log('Valid JSX:', isValidJSX(result3))
  
  // Test 4: Real component style update
  const test4 = `<div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1 style={{ color: '#333' }}>Hello World</h1>
    </div>`
  console.log('\nTest 4 - Real component, update h1 color:')
  console.log('Input:', test4)
  const result4 = updateJSXProperty(test4, 'h1[0]', 'color', '#00ff00', 'style')
  console.log('Output:', result4)
  console.log('Success:', result4.includes("color: '#00ff00'"))
  console.log('Valid JSX:', isValidJSX(result4))
  
  // Test 5: Add style to element with no existing style
  const test5 = `<button>Click me</button>`
  console.log('\nTest 5 - Add style to button with no existing style:')
  console.log('Input:', test5)
  const result5 = updateJSXProperty(test5, 'button[0]', 'backgroundColor', '#007bff', 'style')
  console.log('Output:', result5)
  console.log('Success:', result5.includes('backgroundColor'))
  console.log('Valid JSX:', isValidJSX(result5))
  
  console.log('=== JSX Parser Tests Complete ===')
}

// Call this from browser console to test
if (typeof window !== 'undefined') {
  (window as any).testJSXParser = testJSXParser
}
