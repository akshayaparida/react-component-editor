import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App'

// Ensure real timers for this file to avoid leakage from other tests
vi.useRealTimers()

// Spyable navigate to assert redirect target
vi.mock('react-router-dom', async (orig) => {
  const actual: any = await (orig as any)()
  ;(globalThis as any).__navigateSpy = vi.fn()
  return {
    ...actual,
    useNavigate: () => (globalThis as any).__navigateSpy,
    MemoryRouter: actual.MemoryRouter,
  }
})

// Mock AuthContext with a real React context so ProtectedRoute in App works
vi.mock('@/contexts/AuthContext', () => {
  const React = require('react') as typeof import('react')
  const { Navigate, useLocation } = require('react-router-dom')

  type Ctx = {
    isAuthenticated: boolean
    isLoading: boolean
    user: any
    login: (c?: any) => Promise<void>
    register: (c?: any) => Promise<void>
    logout: () => Promise<void>
    refetchUser: () => void
  }

  const AuthCtx = React.createContext<Ctx | null>(null)

  function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authed, setAuthed] = React.useState(false)
    const value: Ctx = {
      isAuthenticated: authed,
      isLoading: false,
      user: authed ? { id: 'u' } : null,
      login: async () => { setAuthed(true) },
      register: async () => { setAuthed(true) },
      logout: async () => { setAuthed(false) },
      refetchUser: () => {},
    }
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
  }

  function useAuth() {
    const v = React.useContext(AuthCtx)
    if (!v) throw new Error('useAuth mock outside provider')
    return v
  }

  function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const s = useAuth()
    const location = useLocation()
    if (s.isLoading) return (<div>loading</div>)
    if (!s.isAuthenticated) return (<Navigate to="/login" state={{ from: location }} replace />)
    return (<>{children}</>)
  }

  return { useAuth, AuthProvider, ProtectedRoute }
})

import { AuthProvider } from '@/contexts/AuthContext'

function LocationDisplay() {
  const loc = useLocation()
  return <div data-testid="location">{loc.pathname}</div>
}

function renderApp(initialEntries: any[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <LocationDisplay />
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RegisterPage – routes and redirect (TDD)', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('App includes /register route and renders the page', async () => {
    renderApp(['/register'])

    // Should see register heading
    expect(await screen.findByText(/Create your account/i)).toBeInTheDocument()
  })

  it('on successful sign-up, redirects to from.pathname if provided (fallback "/")', async () => {
    // Start at /register with a from state pointing to /library
    renderApp([{ pathname: '/register', state: { from: { pathname: '/library' } } }])

    // Fill the form
    fireEvent.change(await screen.findByLabelText(/Username/i), { target: { value: 'tester' } })
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 't@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password1!' } })
    fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByLabelText(/I agree/i))

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    // Expect navigate('/library', { replace: true }) to be called
    await waitFor(() => {
      const nav = (globalThis as any).__navigateSpy
      expect(nav).toHaveBeenCalled()
    })
    const nav = (globalThis as any).__navigateSpy
    const callArgs = nav.mock.calls.find((c: any[]) => c[0] === '/library')
    expect(callArgs).toBeTruthy()
    expect(callArgs[1]).toMatchObject({ replace: true })
  })
})
