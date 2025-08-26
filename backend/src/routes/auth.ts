import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
  UpdateUserProfileSchema,
} from '../utils/validation';
import {
  validateBody,
  asyncHandler,
  sendSuccessResponse,
  sendErrorResponse,
} from '../middleware/validation';
import {
  hashPassword,
  comparePassword,
  generateTokenPair,
  verifyRefreshToken,
  validatePasswordStrength,
  addTokenToBlacklist,
  extractTokenFromHeader,
} from '../utils/auth';
import { requireAuth, rateLimit } from '../middleware/auth';

const router: Router = Router();
const prisma = new PrismaClient();

// POST /auth/register - User registration
router.post(
  '/register',
  rateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validateBody(RegisterSchema),
  asyncHandler(async (req: any, res: any) => {
    const { email, username, password, name } = req.body;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return sendErrorResponse(res, 'Email Already Exists', 'An account with this email already exists', 409);
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return sendErrorResponse(res, 'Username Already Exists', 'This username is already taken', 409);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return sendErrorResponse(res, 'Weak Password', 'Password does not meet security requirements', 400, passwordValidation.errors);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    try {
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          name: name || null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = generateTokenPair({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      const response = {
        user,
        ...tokens,
      };

      sendSuccessResponse(res, response, 'User registered successfully', 201);
    } catch (error) {
      console.error('Registration error:', error);
      return sendErrorResponse(res, 'Registration Failed', 'Failed to create user account', 500);
    }
  })
);

// POST /auth/login - User login
router.post(
  '/login',
  rateLimit(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
  validateBody(LoginSchema),
  asyncHandler(async (req: any, res: any) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendErrorResponse(res, 'Invalid Credentials', 'Email or password is incorrect', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return sendErrorResponse(res, 'Invalid Credentials', 'Email or password is incorrect', 401);
    }

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response = {
      user: userWithoutPassword,
      ...tokens,
    };

    sendSuccessResponse(res, response, 'Login successful');
  })
);

// POST /auth/refresh - Refresh access token
router.post(
  '/refresh',
  validateBody(RefreshTokenSchema),
  asyncHandler(async (req: any, res: any) => {
    const { refreshToken } = req.body;

    try {
      // Verify refresh token
      const { userId } = verifyRefreshToken(refreshToken);

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
        },
      });

      if (!user) {
        return sendErrorResponse(res, 'Invalid Token', 'User not found', 401);
      }

      // Generate new tokens
      const tokens = generateTokenPair({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      const response = {
        user,
        ...tokens,
      };

      sendSuccessResponse(res, response, 'Token refreshed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      return sendErrorResponse(res, 'Invalid Token', errorMessage, 401);
    }
  })
);

// POST /auth/logout - Logout user (blacklist token)
router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: any, res: any) => {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      addTokenToBlacklist(token);
    }

    sendSuccessResponse(res, null, 'Logout successful');
  })
);

// GET /auth/me - Get current user profile
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: any, res: any) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            components: true,
            componentVersions: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return sendErrorResponse(res, 'User Not Found', 'User profile not found', 404);
    }

    sendSuccessResponse(res, user, 'User profile retrieved successfully');
  })
);

// PUT /auth/profile - Update user profile
router.put(
  '/profile',
  requireAuth,
  validateBody(UpdateUserProfileSchema),
  asyncHandler(async (req: any, res: any) => {
    const { name, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name !== undefined ? name : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    sendSuccessResponse(res, updatedUser, 'Profile updated successfully');
  })
);

// PUT /auth/change-password - Change user password
router.put(
  '/change-password',
  requireAuth,
  validateBody(ChangePasswordSchema),
  asyncHandler(async (req: any, res: any) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        password: true,
      },
    });

    if (!user) {
      return sendErrorResponse(res, 'User Not Found', 'User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return sendErrorResponse(res, 'Invalid Password', 'Current password is incorrect', 400);
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return sendErrorResponse(res, 'Weak Password', 'New password does not meet security requirements', 400, passwordValidation.errors);
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    sendSuccessResponse(res, null, 'Password changed successfully');
  })
);

// DELETE /auth/account - Delete user account
router.delete(
  '/account',
  requireAuth,
  asyncHandler(async (req: any, res: any) => {
    // In a production app, you might want to:
    // 1. Require password confirmation
    // 2. Soft delete instead of hard delete
    // 3. Clean up related data
    // 4. Send confirmation email

    await prisma.user.delete({
      where: { id: req.user.id },
    });

    // Blacklist current token
    const token = extractTokenFromHeader(req.headers.authorization);
    if (token) {
      addTokenToBlacklist(token);
    }

    sendSuccessResponse(res, null, 'Account deleted successfully');
  })
);

export default router;
