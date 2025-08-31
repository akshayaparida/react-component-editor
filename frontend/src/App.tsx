import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SimpleDashboard } from '@/pages/SimpleDashboard'
import { CreateComponentPage } from '@/pages/CreateComponentPage'
import { ComponentDetailPage } from '@/pages/ComponentDetailPage'
import { EditComponentPage } from '@/pages/EditComponentPage'
import { VisualBuilderPage } from '@/pages/VisualBuilderPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { MarketplacePage } from '@/pages/MarketplacePage'
import { ProtectedRoute } from '@/contexts/AuthContext'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SimpleDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreateComponentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/components/new"
        element={
          <ProtectedRoute>
            <CreateComponentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visual-builder"
        element={
          <ProtectedRoute>
            <VisualBuilderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/components/:id"
        element={
          <ProtectedRoute>
            <ComponentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/components/:id/edit"
        element={
          <ProtectedRoute>
            <EditComponentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <MarketplacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      
      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
