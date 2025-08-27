import React from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'

interface CreateComponentButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export function CreateComponentButton({ 
  variant = 'secondary', 
  size = 'md' 
}: CreateComponentButtonProps) {
  const navigate = useNavigate()

  const handleCreate = () => {
    navigate('/components/new')
  }

  return (
    <button
      onClick={handleCreate}
      className={clsx(
        'inline-flex items-center gap-2 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
          'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500': variant === 'secondary',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        }
      )}
    >
      <Plus className={clsx({
        'w-4 h-4': size === 'sm' || size === 'md',
        'w-5 h-5': size === 'lg',
      })} />
      Create Component
    </button>
  )
}
