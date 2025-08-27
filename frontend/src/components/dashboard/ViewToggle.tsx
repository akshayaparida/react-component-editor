import React from 'react'
import { Grid, List } from 'lucide-react'
import { clsx } from 'clsx'

interface ViewToggleProps {
  mode: 'grid' | 'list'
  onChange: (mode: 'grid' | 'list') => void
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex border border-gray-300 rounded-md overflow-hidden">
      <button
        onClick={() => onChange('grid')}
        className={clsx(
          'px-3 py-2 text-sm font-medium focus:outline-none',
          mode === 'grid'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        <Grid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={clsx(
          'px-3 py-2 text-sm font-medium focus:outline-none border-l border-gray-300',
          mode === 'list'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  )
}
