import { z } from 'zod';

export const createComplaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(3000),
  category_id: z.preprocess(val => (typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) ? val : null), z.string().uuid().optional().nullable()),
  department_id: z.preprocess(val => (typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) ? val : null), z.string().uuid().optional().nullable()),
  address: z.string().min(5, 'Address is required').max(500),
  city: z.string().min(2, 'City is required').default('New Delhi'),
  state: z.string().min(2, 'State is required').default('Delhi'),
  pincode: z.preprocess(val => (val === '' ? null : val), z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional().nullable()),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  preferred_language: z.enum(['en', 'hi', 'pa']).default('en'),
  attachments: z.array(z.object({
    file_name: z.string(),
    file_url: z.string().url(),
    file_type: z.string(),
    file_size_bytes: z.number()
  })).optional().default([])
});

export const updateStatusSchema = z.object({
  status: z.enum([
    'submitted',
    'verified',
    'assigned',
    'in_progress',
    'under_review',
    'pending_information',
    'resolution_submitted',
    'resolved',
    'closed',
    'rejected',
    'reopened',
    'escalated'
  ]),
  remarks: z.string().min(5, 'Remarks are required for status updates'),
  resolution_proof_url: z.string().url().optional()
});

export const assignOfficerSchema = z.object({
  officer_id: z.string().uuid('Valid officer ID required'),
  notes: z.string().optional()
});
