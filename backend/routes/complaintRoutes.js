import express from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  submitFeedback,
  reverseGeocodeLocation,
  ipLocationLookup
} from '../controllers/complaintController.js';
import { authenticateUser, requireRole, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Geocoding and IP location helper endpoints (accessible before auth guard)
router.get('/geo/reverse', reverseGeocodeLocation);
router.get('/reverse-geocode', reverseGeocodeLocation);
router.get('/geo/ip-lookup', ipLocationLookup);

// Public grievance tracking by tracking number or UUID (accessible without login)
router.get('/track/:id', optionalAuth, getComplaintById);
router.get('/:id', optionalAuth, getComplaintById);

// Protected routes (require verified login)
router.use(authenticateUser);

router.post('/', createComplaint);
router.get('/', getComplaints);
router.patch('/:id/status', requireRole(['officer', 'department_admin', 'super_admin']), updateStatus);
router.post('/:id/feedback', submitFeedback);

export default router;
