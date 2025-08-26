import { Router } from 'express';
import componentsRouter from './components';
import versionsRouter from './versions';

const router: Router = Router();

// API Routes
router.use('/components', componentsRouter);

// Version routes are nested under components
router.use('/components', versionsRouter);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'React Component Editor API v1.0.0',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
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
        users: 'Coming soon',
        categories: 'Coming soon',
        authentication: 'Coming soon',
        search: 'Available via query params on components endpoint',
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
