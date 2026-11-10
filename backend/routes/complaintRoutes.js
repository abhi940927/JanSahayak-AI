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
import { authenticateUser, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Geocoding and IP location helper endpoints (accessible before auth guard)
router.get('/geo/reverse', reverseGeocodeLocation);
router.get('/reverse-geocode', reverseGeocodeLocation);
router.get('/geo/ip-lookup', ipLocationLookup);

router.use(authenticateUser);

router.post('/', createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.patch('/:id/status', requireRole(['officer', 'department_admin', 'super_admin']), updateStatus);
router.post('/:id/feedback', submitFeedback);

export default router;
