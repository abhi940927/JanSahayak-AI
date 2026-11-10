import express from 'express';
import {
  getCitizenAnalytics,
  getOfficerAnalytics,
  getAdminAnalytics,
  getPublicPlatformSummary
} from '../controllers/analyticsController.js';
import { authenticateUser, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for landing page statistics (no auth required)
router.get('/public-summary', getPublicPlatformSummary);

// Protected routes (require auth)
router.use(authenticateUser);

router.get('/citizen', requireRole(['citizen', 'super_admin']), getCitizenAnalytics);
router.get('/officer', requireRole(['officer', 'department_admin', 'super_admin']), getOfficerAnalytics);
router.get('/admin', requireRole(['department_admin', 'super_admin']), getAdminAnalytics);

export default router;
