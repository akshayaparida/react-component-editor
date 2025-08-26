import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Types
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
}

// JWT Token Generation
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  // @ts-ignore - JWT types issue with string secret
  return jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'react-component-editor',
      audience: 'react-component-editor-users',
    }
  );
};

export const generateRefreshToken = (userId: string): string => {
  // @ts-ignore - JWT types issue with string secret
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'react-component-editor',
      audience: 'react-component-editor-users',
    }
  );
};

export const generateTokenPair = (user: { 
  id: string; 
  email: string; 
  username: string; 
}): TokenResponse => {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
    tokenType: 'Bearer',
  };
};

// JWT Token Verification
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'react-component-editor',
      audience: 'react-component-editor-users',
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw new Error('Token verification failed');
  }
};

export const verifyRefreshToken = (token: string): { userId: string; type: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'react-component-editor',
      audience: 'react-component-editor-users',
    }) as { userId: string; type: string };
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
};

// Password Hashing Utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Token blacklist functionality (for logout)
// In a production app, this should be stored in Redis or database
const tokenBlacklist = new Set<string>();

export const addTokenToBlacklist = (token: string): void => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

// Utility to get token expiration time
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
};

// Generate a secure random password (for password reset)
export const generateSecurePassword = (length: number = 16): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Validate password strength
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
