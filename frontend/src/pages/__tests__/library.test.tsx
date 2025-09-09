import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Spyable navigate stored on globalThis to avoid hoist issues
vi.mock('react-router-dom', async (orig) => {
  const actual: any = await (orig as any)()
  ;(globalThis as any).__navigateSpy = vi.fn()
  return {
    ...actual,
    useNavigate: () => (globalThis as any).__navigateSpy,
    MemoryRouter: actual.MemoryRouter,
  }
})

// Mock API
const listMock = vi.fn()

vi.mock('@/lib/api', () => ({
  visualComponentsApi: {
    list: (...args: any[]) => listMock(...args),
  },
}))

// Import after mocks
import { LibraryPage } from '@/pages/LibraryPage'

describe('LibraryPage (My Components) – TDD', () => {
  beforeEach(() => {
    vi.useRealTimers()
    const nav = (globalThis as any).__navigateSpy
    if (nav) nav.mockReset()
    listMock.mockReset()
  })

  it('shows empty state when no components', async () => {
    listMock.mockResolvedValueOnce([])

    render(<LibraryPage />)

    expect(await screen.findByText(/No components yet/i)).toBeInTheDocument()
  })

  it('renders list and Open navigates to visual editor with id', async () => {
    listMock.mockResolvedValueOnce([
      { id: 'a1', name: 'Header', updatedAt: new Date().toISOString(), viewCount: 3 },
      { id: 'b2', name: 'Footer', updatedAt: new Date().toISOString(), viewCount: 0 },
    ])

    render(<LibraryPage />)

    expect(await screen.findByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Open Header/i }))

    const nav = (globalThis as any).__navigateSpy
    expect(nav).toHaveBeenCalledWith('/visual-editor?id=a1')
  })

  it('search filters results via API call', async () => {
    listMock.mockResolvedValueOnce([]) // initial load
    listMock.mockResolvedValueOnce([{ id: 'x1', name: 'Invoice', updatedAt: new Date().toISOString(), viewCount: 1 }])

    render(<LibraryPage />)

    const input = await screen.findByPlaceholderText(/Search my components/i)
    fireEvent.change(input, { target: { value: 'invoice' } })

    // Expect filtered result to appear
    expect(await screen.findByText('Invoice')).toBeInTheDocument()
  })
})

