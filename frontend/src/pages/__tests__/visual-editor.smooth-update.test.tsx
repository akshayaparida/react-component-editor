import React from 'react'
import ReactDOMClient from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock router hooks used by the page to include an id param (so autoSave is skipped)
vi.mock('react-router-dom', async (orig) => {
  const actual: any = await (orig as any)()
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams('id=test-id'), vi.fn()],
  }
})

// Mock API to avoid network
vi.mock('@/lib/api', () => ({
  visualComponentsApi: {
    create: vi.fn().mockResolvedValue({ id: 'test-id', name: 'Component_test', jsxCode: "function MyComponent(){return (<div data-veid='v0'><h1 data-veid='v1'>Hello World</h1></div>)}", description: '' }),
    update: vi.fn().mockResolvedValue({ ok: true }),
    getById: vi.fn().mockResolvedValue({ id: 'test-id', name: 'Loaded', jsxCode: "function MyComponent(){return (<div data-veid='v0'><h1 data-veid='v1'>Hello World</h1></div>)}" }),
  }
}))

import { VisualEditorPage } from '@/pages/VisualEditorPage'

const advance = async (ms = 350) => {
  vi.advanceTimersByTime(ms)
  // allow microtasks to flush
  await Promise.resolve()
}

describe('VisualEditorPage – smooth preview behavior', () => {
  beforeEach(() => {
    // Clean up DOM between tests
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('keeps a single React root mounted across code edits (no remount churn)', async () => {
    const createRootSpy = vi.spyOn(ReactDOMClient, 'createRoot')

    render(<VisualEditorPage testMode />)

    // initial preview render
    await advance()

    // Edit the code in textarea (wait until it appears if loading state is shown)
    const textarea = await (async () => {
      for (let i = 0; i < 20; i++) {
        const el = document.querySelector('textarea') as HTMLTextAreaElement | null
        if (el) return el
        await advance(50)
      }
      return null
    })()
    expect(textarea).toBeTruthy()

    const next = (textarea.value || '').trim() + '\n// edit to trigger re-render' 
    fireEvent.change(textarea, { target: { value: next } })

    await advance()

    // Desired behavior: createRoot called once total. It currently remounts each update, so this will FAIL now.
    expect(createRootSpy).toHaveBeenCalledTimes(1)
  })

  it('does not drop characters while typing text content (input stays in-sync immediately)', async () => {
    render(<VisualEditorPage testMode />)
    await advance()

    // In testMode, the properties panel is pre-populated with an H1 selection
    const input = await (async () => {
      for (let i = 0; i < 20; i++) {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[]
        const found = inputs.find((el) => el.value.includes('Hello World'))
        if (found) return found
        await advance(50)
      }
      return null
    })()
    expect(input).toBeTruthy()

    // Type characters one by one and ensure value keeps growing immediately
    const toType = ' Warp'
    for (const ch of toType) {
      const nextVal = (input as HTMLInputElement).value + ch
      fireEvent.input(input as HTMLInputElement, { target: { value: nextVal } })
      // Immediately synchronized – should match nextVal without waiting for timers
      expect((input as HTMLInputElement).value).toBe(nextVal)
      // Let any async effects settle for the next iteration
      await Promise.resolve()
    }
  })
})
