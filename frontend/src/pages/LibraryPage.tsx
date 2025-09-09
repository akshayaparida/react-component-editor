import React, { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { visualComponentsApi } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'

interface VCListItem {
  id: string
  name: string | null
  updatedAt: string
  viewCount: number
}

function LibraryPageInner() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<VCListItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setIsLoading(true)
      const res = await (visualComponentsApi as any).list({ limit: 50, search })
      if (!cancelled) {
        setItems(res || [])
        setIsLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [search])

  const openDoc = (id: string) => {
    navigate(`/visual-editor?id=${id}`)
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">My Components</h1>

      <div className="mb-4">
        <input
          placeholder="Search my components"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {isLoading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-600">No components yet</div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between border p-3 rounded">
              <div>
                <div className="font-medium">{it.name || 'Untitled'}</div>
                <div className="text-xs text-gray-500">Updated {formatRelativeTime(it.updatedAt)} · {it.viewCount} views</div>
              </div>
              <button
                onClick={() => openDoc(it.id)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                aria-label={`Open ${it.name || 'Untitled'}`}
              >
                {`Open ${it.name || 'Untitled'}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function LibraryPage() {
  return <LibraryPageInner />
}

