import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SimpleDashboard } from '@/pages/SimpleDashboard'
import { VisualEditorPage } from '@/pages/VisualEditorPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { LoginStub } from '@/pages/LoginStub'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SimpleDashboard />} />
      <Route path="/visual-editor" element={<VisualEditorPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/login" element={<LoginStub />} />
      
      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
