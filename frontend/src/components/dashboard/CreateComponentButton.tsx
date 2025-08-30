import React, { useState, useRef, useEffect } from 'react'
import { Plus, Code, Palette, ChevronDown } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const options = [
    {
      id: 'visual',
      name: 'Visual Builder',
      description: 'No-code visual editor',
      icon: Palette,
      path: '/visual-builder',
      badge: 'New!'
    },
    {
      id: 'code',
      name: 'Code Editor',
      description: 'Write React code directly',
      icon: Code,
      path: '/components/new',
      badge: null
    }
  ]

  const handleOptionClick = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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
        <ChevronDown className={clsx(
          'transition-transform',
          {
            'w-4 h-4': size === 'sm' || size === 'md',
            'w-5 h-5': size === 'lg',
            'rotate-180': isOpen
          }
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {options.map((option) => {
            const IconComponent = option.icon
            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.path)}
                className="w-full flex items-start p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <IconComponent className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{option.name}</span>
                    {option.badge && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{option.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
