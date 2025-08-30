import React from 'react'
import { useNavigate } from 'react-router-dom'
import { VisualComponentBuilder } from '@/components/visual-editor/VisualComponentBuilder'
import { ComponentState } from '@/components/visual-editor/types'

export function VisualBuilderPage() {
  const navigate = useNavigate()

  const handleSave = (component: ComponentState) => {
    // In a real app, you would save this to the backend
    console.log('Saving component:', component)
    
    // For demo, we'll just show a success message and redirect
    // In production, you'd integrate with your existing API
    setTimeout(() => {
      navigate('/')
    }, 1000)
  }

  return (
    <VisualComponentBuilder 
      onSave={handleSave}
    />
  )
}
