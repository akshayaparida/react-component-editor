import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SimpleDashboard } from '@/pages/SimpleDashboard'
import { VisualEditorPage } from '@/pages/VisualEditorPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ProtectedRoute } from '@/contexts/AuthContext'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SimpleDashboard />} />
      <Route path="/visual-editor" element={<VisualEditorPage />} />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <LibraryPage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
