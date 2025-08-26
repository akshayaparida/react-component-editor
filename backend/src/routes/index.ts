import { Router } from 'express';
import componentsRouter from './components';
import versionsRouter from './versions';
import authRouter from './auth';
import categoriesRouter from './categories';

const router: Router = Router();

// Authentication routes
router.use('/auth', authRouter);

// API Routes
router.use('/components', componentsRouter);
router.use('/categories', categoriesRouter);

// Version routes are nested under components
router.use('/components', versionsRouter);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'React Component Editor API v1.0.0',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        refresh: 'POST /api/v1/auth/refresh',
        logout: 'POST /api/v1/auth/logout',
        profile: 'GET /api/v1/auth/profile',
        changePassword: 'PUT /api/v1/auth/change-password',
        deleteAccount: 'DELETE /api/v1/auth/delete-account',
      },
      categories: {
        list: 'GET /api/v1/categories',
        create: 'POST /api/v1/categories (admin)',
        get: 'GET /api/v1/categories/:id',
        getBySlug: 'GET /api/v1/categories/slug/:slug',
        update: 'PUT /api/v1/categories/:id (admin)',
        delete: 'DELETE /api/v1/categories/:id (admin)',
        components: 'GET /api/v1/categories/:id/components',
        stats: 'GET /api/v1/categories/stats (admin)',
      },
      components: {
        list: 'GET /api/v1/components',
        create: 'POST /api/v1/components',
        get: 'GET /api/v1/components/:id',
        update: 'PUT /api/v1/components/:id',
        delete: 'DELETE /api/v1/components/:id',
        versions: {
          list: 'GET /api/v1/components/:componentId/versions',
          create: 'POST /api/v1/components/:componentId/versions',
          get: 'GET /api/v1/components/:componentId/versions/:version',
          publish: 'PUT /api/v1/components/:componentId/versions/:version/publish',
          delete: 'DELETE /api/v1/components/:componentId/versions/:version',
        },
      },
      future_endpoints: {
        users: 'User management system (planned)',
        favorites: 'Component favorites system (planned)',
        file_uploads: 'File upload support',
        search: 'Advanced search (available via query params)',
        analytics: 'User activity tracking',
      },
    },
    features: {
      component_management: 'Create, read, update, delete components',
      version_control: 'Full semantic versioning support',
      search_filtering: 'Advanced search and filtering capabilities',
      validation: 'Comprehensive input validation with Zod',
      pagination: 'Efficient pagination for large datasets',
      error_handling: 'Standardized error responses',
    },
  });
});

export default router;
