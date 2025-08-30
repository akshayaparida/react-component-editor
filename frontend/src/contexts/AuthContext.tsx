import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import { authApi, tokenManager } from '@/lib/api';
import type { AuthUser, LoginCredentials, RegisterCredentials } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Query user profile
  const {
    data: user,
    isLoading: isUserLoading,
    error,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: authApi.getProfile,
    enabled: !!tokenManager.getToken() && isInitialized,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Initialize auth state
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      tokenManager.setToken(data.accessToken);
      tokenManager.setRefreshToken(data.refreshToken);
      queryClient.setQueryData(['auth', 'profile'], data.user);
      toast.success('Welcome back!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      tokenManager.setToken(data.accessToken);
      tokenManager.setRefreshToken(data.refreshToken);
      queryClient.setQueryData(['auth', 'profile'], data.user);
      toast.success('Account created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      tokenManager.clearTokens();
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Even if logout fails on server, clear local tokens
      tokenManager.clearTokens();
      queryClient.clear();
      toast.success('Logged out successfully');
    },
  });

  // Handle token expiry or invalid token
  useEffect(() => {
    if (error && tokenManager.getToken()) {
      tokenManager.clearTokens();
      queryClient.clear();
      toast.error('Session expired. Please log in again.');
    }
  }, [error, queryClient]);

  const isAuthenticated = !!user && !!tokenManager.getToken();
  const isLoading = isUserLoading || !isInitialized;

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated,
    isLoading,
    login: async (credentials: LoginCredentials) => {
      await loginMutation.mutateAsync(credentials);
    },
    register: async (credentials: RegisterCredentials) => {
      await registerMutation.mutateAsync(credentials);
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    refetchUser: () => refetchUser(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route wrapper component
export function ProtectedRoute({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
