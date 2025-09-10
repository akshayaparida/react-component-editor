import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Ensure real timers for this file to avoid leakage from other tests
vi.useRealTimers()

// Mock only the authApi.login method; keep other exports (tokenManager, etc.) real
vi.mock('@/lib/api', async (orig) => {
  const actual: any = await (orig as any)()
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      login: vi.fn(),
    },
  }
})

// Mock AuthContext to avoid real react-query + timing side-effects
vi.mock('@/contexts/AuthContext', () => {
  const state = { isAuthenticated: false, isLoading: false, user: null }
  const login = vi.fn(async () => {})
  const register = vi.fn(async () => {})
  const logout = vi.fn(async () => {})
  const refetchUser = vi.fn(() => {})
  function useAuth() {
    return { ...state, login, register, logout, refetchUser }
  }
  function AuthProvider({ children }: { children: React.ReactNode }) {
    return children as any
  }
  return { useAuth, AuthProvider }
})

import { AuthProvider } from '@/contexts/AuthContext'
import { LoginPage } from '@/pages/LoginPage'
import { authApi } from '@/lib/api'

function LocationDisplay() {
  const loc = useLocation()
  return <div data-testid="location">{loc.pathname}</div>
}

function renderRoutesWithProviders(initialEntries: any[]) {
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
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/library" element={<div>My Components</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage – TDD', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('logs in and redirects to the `from` location', async () => {
    // Arrange: mock successful login response
    ;(authApi.login as any).mockResolvedValueOnce({
      accessToken: 'at',
      refreshToken: 'rt',
      user: { id: 'u1', email: 'user@example.com', name: 'User One' },
    })

    // Start at /login with state.from = /library
    renderRoutesWithProviders([
      { pathname: '/login', state: { from: { pathname: '/library' } } },
    ])

    // Ensure login page rendered
    expect(await screen.findByText(/Welcome back/i)).toBeInTheDocument()

    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Assert: user is redirected to /library path
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/library')
    })

    // And page content visible
    expect(screen.getByText(/My Components/i)).toBeInTheDocument()
  })

  it('redirects using ?from path when no location.state is present', async () => {
    // Arrange: simulate successful login (AuthContext.login resolves)
    ;(authApi.login as any).mockResolvedValueOnce({})

    // Start at /login?from=/library
    renderRoutesWithProviders(['/login?from=/library'])

    // Ensure login page rendered
    expect(await screen.findByText(/Welcome back/i)).toBeInTheDocument()

    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Assert: redirected to /library from query parameter
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/library')
    })
  })

  it('guards against open redirects via ?from and falls back to /', async () => {
    ;(authApi.login as any).mockResolvedValueOnce({})

    // Start at /login?from=https://evil.com
    renderRoutesWithProviders(['/login?from=https://evil.com'])

    expect(await screen.findByText(/Welcome back/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'secret' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('/')
    })
  })
})

