import { ComplaintService } from '../services/complaintService.js';
import {
  createComplaintSchema,
  updateStatusSchema,
  assignOfficerSchema
} from '../validators/complaintValidator.js';

export const createComplaint = async (req, res, next) => {
  try {
    const validatedData = createComplaintSchema.parse(req.body);
    const complaint = await ComplaintService.createComplaint(validatedData, req.user);
    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully and registered in system',
      data: complaint
    });
  } catch (err) {
    next(err);
  }
};

export const getComplaints = async (req, res, next) => {
  try {
    const { status, priority, department_id, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await ComplaintService.getComplaints({
      user: req.user,
      status,
      priority,
      department_id,
      search,
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: result.complaints,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await ComplaintService.getComplaintById(id, req.user);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found with the provided identifier'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);

    const updated = await ComplaintService.updateStatus(id, validatedData, req.user);
    res.json({
      success: true,
      message: `Status updated to ${validatedData.status}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};
