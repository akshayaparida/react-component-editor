import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { User, Edit3, Save, X, Calendar, Hash, Mail, Award } from 'lucide-react'
import { api } from '@/lib/api'

const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
})

type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>

interface UserProfile {
  id: string
  email: string
  username: string
  name: string
  avatar?: string
  createdAt: string
  updatedAt: string
  _count: {
    components: number
    componentVersions: number
    favorites: number
  }
}

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)

  // Fetch user profile
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await api.get('/auth/me')
      return response.data.data as UserProfile
    },
  })

  // Form for editing profile
  const form = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: profile?.name || '',
      avatar: profile?.avatar || '',
    },
  })

  // Update form defaults when profile data loads
  React.useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        avatar: profile.avatar || '',
      })
    }
  }, [profile, form])

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateForm) => {
      const response = await api.put('/auth/profile', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      refetch()
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update profile'
      toast.error(message)
    },
  })

  const handleSubmit = form.handleSubmit((data) => {
    updateProfileMutation.mutate(data)
  })

  const handleCancel = () => {
    setIsEditing(false)
    form.reset({
      name: profile?.name || '',
      avatar: profile?.avatar || '',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
          <p className="text-gray-600 mt-2">Unable to load your profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-8">
            {/* Profile Header */}
            <div className="flex items-start space-x-6 mb-8">
              <div className="flex-shrink-0">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name || profile.username}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center">
                    <User className="w-12 h-12 text-blue-600" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        {...form.register('name')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your name"
                      />
                      {form.formState.errors.name && (
                        <p className="mt-1 text-xs text-red-600">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Avatar URL
                      </label>
                      <input
                        type="url"
                        {...form.register('avatar')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://example.com/avatar.jpg"
                      />
                      {form.formState.errors.avatar && (
                        <p className="mt-1 text-xs text-red-600">
                          {form.formState.errors.avatar.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {profile.name || 'Unnamed User'}
                    </h2>
                    <p className="text-lg text-gray-600 mt-1">@{profile.username}</p>
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Information */}
            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profile.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Hash className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">@{profile.username}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Award className="w-6 h-6 text-blue-600 mr-2" />
                          <div>
                            <p className="text-2xl font-bold text-blue-900">
                              {profile._count.components}
                            </p>
                            <p className="text-sm text-blue-600">Components</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Award className="w-6 h-6 text-green-600 mr-2" />
                          <div>
                            <p className="text-2xl font-bold text-green-900">
                              {profile._count.componentVersions}
                            </p>
                            <p className="text-sm text-green-600">Versions</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Award className="w-6 h-6 text-purple-600 mr-2" />
                          <div>
                            <p className="text-2xl font-bold text-purple-900">
                              {profile._count.favorites}
                            </p>
                            <p className="text-sm text-purple-600">Favorites</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Award className="w-6 h-6 text-orange-600 mr-2" />
                          <div>
                            <p className="text-2xl font-bold text-orange-900">
                              {Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                            </p>
                            <p className="text-sm text-orange-600">Days Active</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
