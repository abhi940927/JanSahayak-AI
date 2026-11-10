import express from 'express';
import { getDepartments, getCategories } from '../controllers/departmentController.js';

const router = express.Router();

router.get('/departments', getDepartments);
router.get('/categories', getCategories);

export default router;
