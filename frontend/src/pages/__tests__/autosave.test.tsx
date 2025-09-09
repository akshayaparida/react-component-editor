import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

// We will dynamically control the query string used by useSearchParams
let searchParamsString = ''

vi.mock('react-router-dom', async (orig) => {
  const actual: any = await (orig as any)()
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(searchParamsString), vi.fn()],
  }
})

// Mock API client; each test can override implementations as needed
const updateMock = vi.fn()
const createMock = vi.fn()
const getByIdMock = vi.fn()

vi.mock('@/lib/api', () => ({
  visualComponentsApi: {
    create: (...args: any[]) => createMock(...args),
    update: (...args: any[]) => updateMock(...args),
    getById: (...args: any[]) => getByIdMock(...args),
    list: vi.fn(),
  },
}))

import { VisualEditorPage } from '@/pages/VisualEditorPage'

// Small helper to advance fake timers and flush microtasks
const advance = async (ms = 0) => {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
  await Promise.resolve()
}

// Utility to get the code textarea reliably
const getTextarea = async () => {
  for (let i = 0; i < 30; i++) {
    const el = document.querySelector('textarea') as HTMLTextAreaElement | null
    if (el) return el
    await advance(50)
  }
  throw new Error('textarea not found')
}

// Provide a stable initial component for id-based tests
const initialComponent = {
  id: 'test-id',
  name: 'Loaded',
  jsxCode: "function MyComponent(){return (<div data-veid='v0'><h1 data-veid='v1'>Hello</h1></div>)}",
}

describe('VisualEditorPage – autosave (TDD)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.useFakeTimers()
    updateMock.mockReset()
    createMock.mockReset()
    getByIdMock.mockReset()
    // default: if id present, load a component quickly
    getByIdMock.mockResolvedValue(initialComponent)
    // default: fast resolve for create/update; tests may override
    createMock.mockResolvedValue({ id: 'new-id', name: 'Component_new', jsxCode: initialComponent.jsxCode })
    updateMock.mockResolvedValue({ ok: true })
    // default: no id in URL; tests set this as needed
    searchParamsString = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('1) Debounced single save after burst of changes (1000ms, final code only)', async () => {
    // Given existing componentId
    searchParamsString = 'id=test-id'

    render(<VisualEditorPage />)
    await advance(10)

    const textarea = await getTextarea()

    // When code is changed 5 times within <= 1000ms window
    for (let i = 0; i < 5; i++) {
      fireEvent.change(textarea, { target: { value: `code ${i}` } })
      await advance(150) // total 750ms between first and last change
    }

    // Then exactly 1 update occurs after 1000ms with the final code string
    expect(updateMock).not.toHaveBeenCalled()
    await advance(1000)
    expect(updateMock).toHaveBeenCalledTimes(1)
    const lastCall = updateMock.mock.calls[0]
    expect(lastCall[0]).toBe('test-id')
    expect(lastCall[1]).toMatchObject({ jsxCode: 'code 4' })
  })

  it('2) Coalesce while a save is in-flight (2 saves total: first + one queued with latest)', async () => {
    searchParamsString = 'id=test-id'

    // Mock update to resolve slowly (after 1500ms)
    updateMock.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 1500)))

    render(<VisualEditorPage />)
    await advance(10)

    const textarea = await getTextarea()

    // First change triggers debounced save
    fireEvent.change(textarea, { target: { value: 'first draft' } })
    await advance(1000) // debounce fires, first save starts (in-flight)
    expect(updateMock).toHaveBeenCalledTimes(1)

    // While in-flight, change code again multiple times
    fireEvent.change(textarea, { target: { value: 'second draft' } })
    fireEvent.change(textarea, { target: { value: 'final draft' } })

    // Resolve the in-flight request (1500ms)
    await advance(1500)

    // Allow queued run to execute immediately after first resolves
    await advance(0)

    expect(updateMock).toHaveBeenCalledTimes(2)
    const last = updateMock.mock.calls[1]
    expect(last[0]).toBe('test-id')
    expect(last[1]).toMatchObject({ jsxCode: 'final draft' })
  })

  it('3) No auto-save without componentId until initial create returns id', async () => {
    // No id in URL; initial code equals default, so first edit triggers create()
    searchParamsString = ''

    // Delay create to simulate network so we can assert no update until id exists
    createMock.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ id: 'new-id', name: 'Component_new', jsxCode: '' }), 2000)))

    render(<VisualEditorPage />)
    await advance(10)

    const textarea = await getTextarea()

    // Change code to diverge from default and trigger create
    fireEvent.change(textarea, { target: { value: 'new code after first edit' } })

    // Ensure no update call before create resolves (2s)
    await advance(1200)
    expect(updateMock).not.toHaveBeenCalled()
    await advance(1000) // total 2200ms -> create resolves now

    // Subsequent edits now should trigger debounced update
    fireEvent.change(textarea, { target: { value: 'new code v2' } })
    await advance(1000)
    expect(updateMock).toHaveBeenCalledTimes(1)
  })

  it('4) No redundant saves for identical code (idempotency guard)', async () => {
    searchParamsString = 'id=test-id'

    render(<VisualEditorPage />)
    await advance(10)

    const textarea = await getTextarea()

    // First change + save
    fireEvent.change(textarea, { target: { value: 'B' } })
    await advance(1000)
    expect(updateMock).toHaveBeenCalledTimes(1)

    // Re-enter identical code; should not trigger another save after debounce
    fireEvent.change(textarea, { target: { value: 'B' } })
    await advance(1200)
    expect(updateMock).toHaveBeenCalledTimes(1)
  })

  it('5) Status indicator flips: "Saving…" during request, then "All changes saved" after success', async () => {
    searchParamsString = 'id=test-id'

    // Keep the promise so we control when it resolves
    let resolveSave: (v?: any) => void
    updateMock.mockImplementation(() => new Promise((res) => { resolveSave = res }))

    render(<VisualEditorPage />)
    await advance(10)

    const textarea = await getTextarea()
    fireEvent.change(textarea, { target: { value: 'typed text' } })

    await advance(1000) // debounce -> starts saving

    // Expect status shows "Saving…"
    expect(screen.getByText(/Saving…/i)).toBeInTheDocument()

    // Resolve the request
    resolveSave && resolveSave({ ok: true })
    await advance(0)

    // Expect status changes to "All changes saved"
    expect(screen.getByText(/All changes saved/i)).toBeInTheDocument()
  })

  it('6) Retry on failure: shows "Retrying…" then succeeds; exactly 2 update calls', async () => {
    searchParamsString = 'id=test-id'

    updateMock
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ ok: true })

    render(<VisualEditorPage />)
    await advance(10)

    const textarea = await getTextarea()
    fireEvent.change(textarea, { target: { value: 'retry me' } })

    // First attempt after debounce -> fails
    await advance(1000)
    expect(updateMock).toHaveBeenCalledTimes(1)

    // Should show Retrying… status and schedule a backoff retry (base 1000ms)
    expect(screen.getByText(/Retrying…/i)).toBeInTheDocument()

    // Backoff delay (1s), then retry fires and succeeds
    await advance(1000)
    expect(updateMock).toHaveBeenCalledTimes(2)

    // Finally, status should report success
    await advance(0)
    expect(screen.getByText(/All changes saved/i)).toBeInTheDocument()
  })
})
