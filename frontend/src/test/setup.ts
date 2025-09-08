import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Stable timers for tests that rely on setTimeout-based re-rendering
vi.useFakeTimers()

// Basic stubs for browser APIs used in the editor
Object.defineProperty(window, 'alert', { value: vi.fn(), writable: true })

// Clipboard not used in these tests but stub to avoid errors if called
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn() },
  configurable: true,
})
