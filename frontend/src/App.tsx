import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CreateComponentPage } from '@/pages/CreateComponentPage'
import { ComponentDetailPage } from '@/pages/ComponentDetailPage'
import { EditComponentPage } from '@/pages/EditComponentPage'
import { VisualBuilderPage } from '@/pages/VisualBuilderPage'
import { ProfilePage } from '@/pages/ProfilePage'
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
            <DashboardPage />
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
            <CreateComponentPage />
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
