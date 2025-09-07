import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SimpleDashboard } from '@/pages/SimpleDashboard'
import { CreateComponentPage } from '@/pages/CreateComponentPage'
import { ComponentDetailPage } from '@/pages/ComponentDetailPage'
import { EditComponentPage } from '@/pages/EditComponentPage'
import { RunableEditorPage } from '@/pages/RunableEditorPage'
import { VisualEditorPage } from '@/pages/VisualEditorPage'

function App() {
  return (
    <Routes>
      {/* All routes are public now */}
      <Route path="/" element={<SimpleDashboard />} />
      <Route path="/create" element={<CreateComponentPage />} />
      <Route path="/components/new" element={<CreateComponentPage />} />
      <Route path="/components/:id" element={<ComponentDetailPage />} />
      <Route path="/components/:id/edit" element={<EditComponentPage />} />
      <Route path="/runable" element={<RunableEditorPage />} />
      <Route path="/visual-editor" element={<VisualEditorPage />} />
      
      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
