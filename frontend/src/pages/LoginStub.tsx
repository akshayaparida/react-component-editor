import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export function LoginStub() {
  const location = useLocation()
  const from = new URLSearchParams(location.search).get('from') || '/'
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">Login Required</h1>
        <p className="text-gray-600 mb-4">
          You need to log in to continue. This is a placeholder login screen.
        </p>
        <div className="space-x-3">
          <Link to={from} className="px-4 py-2 bg-gray-100 text-gray-800 rounded border border-gray-200">
            Go Back
          </Link>
          <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

