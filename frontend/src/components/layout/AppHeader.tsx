import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { User, ChevronDown, Settings, LogOut, Home } from 'lucide-react'
import { api } from '@/lib/api'
// import { useAuth } from '@/hooks/useAuth'

interface AppHeaderProps {
  title?: string
  children?: React.ReactNode
}

export function AppHeader({ title = 'Component Dashboard', children }: AppHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  // const { user, setUser } = useAuth()
  const user = { name: 'Demo User' } // Mock user for demo

  // Mock profile for demo
  const profile = {
    name: 'Demo User',
    username: 'demo',
    email: 'demo@example.com'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  const handleLogout = () => {
    // No auth needed for demo
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link 
              to="/library" 
              className="ml-4 text-gray-600 hover:text-gray-900 border border-gray-200 rounded px-2 py-1 text-sm"
            >
              My Components
            </Link>
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {children}
            

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 text-sm bg-white border border-gray-200 rounded-full px-3 py-2 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name || profile.username}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <span className="hidden sm:block text-gray-700 font-medium">
                  {profile?.name || profile?.username || 'User'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.name || 'Unnamed User'}
                    </p>
                    <p className="text-xs text-gray-500">@{profile?.username}</p>
                    <p className="text-xs text-gray-500">{profile?.email}</p>
                  </div>


                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-red-400" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
