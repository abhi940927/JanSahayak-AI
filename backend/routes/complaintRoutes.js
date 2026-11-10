import express from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  submitFeedback
} from '../controllers/complaintController.js';
import { authenticateUser, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

router.post('/', createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.patch('/:id/status', requireRole(['officer', 'department_admin', 'super_admin']), updateStatus);
router.post('/:id/feedback', submitFeedback);

export default router;
