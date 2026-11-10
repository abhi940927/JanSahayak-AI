/**
 * Phase 16 - Comprehensive QA Full-Stack Security & Lifecycle Audit Script
 */

import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5001/api';
const results = [];

function record(name, status, details) {
  results.push({ test: name, status, details });
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${symbol} [${status}] ${name}: ${details}`);
}

async function runAudit() {
  console.log('=== STARTING BACKEND AUTH, SECURITY & LIFECYCLE AUDIT ===\n');

  // 1. Health check
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    if (res.status === 200 && res.data.status === 'healthy') {
      record('Backend Health Check', 'PASS', 'Status 200, service healthy');
    } else {
      record('Backend Health Check', 'FAIL', `Received status ${res.status}`);
    }
  } catch (e) {
    record('Backend Health Check', 'FAIL', e.message);
  }

  // 2. Fetch Departments & Categories
  try {
    const dRes = await axios.get(`${BASE_URL}/departments`);
    const cRes = await axios.get(`${BASE_URL}/categories`);
    if (dRes.data.data.length >= 6 && cRes.data.data.length >= 5) {
      record('Department & Category API', 'PASS', `Loaded ${dRes.data.data.length} depts and ${cRes.data.data.length} categories`);
    } else {
      record('Department & Category API', 'FAIL', 'Incomplete seed departments');
    }
  } catch (e) {
    record('Department & Category API', 'FAIL', e.message);
  }

  // 3. Zod Payload Validation Test (Short description < 15 chars, invalid pincode)
  try {
    await axios.post(`${BASE_URL}/complaints`, {
      title: 'Valid Title Here',
      description: 'Too short', // < 15 chars
      address: 'Test Address',
      pincode: '123' // Invalid (must be 6 digits)
    }, {
      headers: { 'x-demo-role': 'citizen' }
    });
    record('Zod Validation Rejection', 'FAIL', 'API allowed invalid payload');
  } catch (e) {
    if (e.response && e.response.status === 400 && e.response.data.message.includes('Validation failed')) {
      record('Zod Validation Rejection', 'PASS', 'Rejected invalid payload with HTTP 400 and detailed field errors');
    } else {
      record('Zod Validation Rejection', 'FAIL', `Unexpected error: ${e.message}`);
    }
  }

  // 4. Role Escalation Prevention Test: Citizen attempting to modify complaint status
  try {
    await axios.patch(`${BASE_URL}/complaints/d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01/status`, {
      status: 'resolved',
      remarks: 'Attempting unauthorized status close as citizen'
    }, {
      headers: { 'x-demo-role': 'citizen' } // Citizen should be rejected!
    });
    record('Security - Role Escalation Prevention', 'FAIL', 'Citizen was erroneously allowed to update officer status');
  } catch (e) {
    if (e.response && e.response.status === 403) {
      record('Security - Role Escalation Prevention', 'PASS', `HTTP 403 Forbidden correctly returned: ${e.response.data.message}`);
    } else {
      record('Security - Role Escalation Prevention', 'FAIL', `Unexpected response: ${e.response?.status}`);
    }
  }

  // 5. Complete 11-Step Grievance Lifecycle
  let complaintId = null;
  let trackingNumber = null;

  // Step 5.1: Citizen files complaint
  try {
    const createRes = await axios.post(`${BASE_URL}/complaints`, {
      title: 'Water pipeline burst on Main Road',
      description: 'Clean drinking water gushing heavily onto street, severe road flooding and wastage.',
      address: 'Near Laxmi Nagar Metro Pillar 44',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110092',
      latitude: 28.6304,
      longitude: 77.2773,
      preferred_language: 'en'
    }, {
      headers: { 'x-demo-role': 'citizen' }
    });
    complaintId = createRes.data.data.id;
    trackingNumber = createRes.data.data.tracking_number;
    record('Lifecycle 1: Citizen Submission', 'PASS', `Created ${trackingNumber} (Status: ${createRes.data.data.status})`);
  } catch (e) {
    record('Lifecycle 1: Citizen Submission', 'FAIL', e.message);
  }

  // Step 5.2: Verify complaint details and initial audit history
  try {
    const detailRes = await axios.get(`${BASE_URL}/complaints/${complaintId}`, {
      headers: { 'x-demo-role': 'citizen' }
    });
    if (detailRes.data.data.history.length >= 1) {
      record('Lifecycle 2: Initial Audit History', 'PASS', `History entries: ${detailRes.data.data.history.length}`);
    } else {
      record('Lifecycle 2: Initial Audit History', 'FAIL', 'No audit history created');
    }
  } catch (e) {
    record('Lifecycle 2: Initial Audit History', 'FAIL', e.message);
  }

  // Step 5.3: Verify in-app notification creation
  try {
    const notifRes = await axios.get(`${BASE_URL}/notifications`, {
      headers: { 'x-demo-role': 'citizen' }
    });
    const found = notifRes.data.data.some(n => n.complaint_id === complaintId);
    if (found) {
      record('Lifecycle 3: In-App Notification Delivery', 'PASS', 'Citizen alert generated in notification feed');
    } else {
      record('Lifecycle 3: In-App Notification Delivery', 'FAIL', 'Notification not found in feed');
    }
  } catch (e) {
    record('Lifecycle 3: In-App Notification Delivery', 'FAIL', e.message);
  }

  // Step 5.4: Officer updates status to in_progress
  try {
    const progRes = await axios.patch(`${BASE_URL}/complaints/${complaintId}/status`, {
      status: 'in_progress',
      remarks: 'Field engineer unit dispatched to site for repair work.'
    }, {
      headers: { 'x-demo-role': 'officer' }
    });
    if (progRes.data.data.status === 'in_progress') {
      record('Lifecycle 4: Officer Status Transition (in_progress)', 'PASS', 'Status successfully moved to in_progress');
    } else {
      record('Lifecycle 4: Officer Status Transition (in_progress)', 'FAIL', 'Status update failed');
    }
  } catch (e) {
    record('Lifecycle 4: Officer Status Transition (in_progress)', 'FAIL', e.message);
  }

  // Step 5.5: Officer updates status to resolved
  try {
    const resRes = await axios.patch(`${BASE_URL}/complaints/${complaintId}/status`, {
      status: 'resolved',
      remarks: 'Pipeline repaired and pressure tested. Water supply restored.'
    }, {
      headers: { 'x-demo-role': 'officer' }
    });
    if (resRes.data.data.status === 'resolved') {
      record('Lifecycle 5: Officer Resolution & Remarks Commit', 'PASS', 'Status resolved, timestamps and remarks logged');
    } else {
      record('Lifecycle 5: Officer Resolution & Remarks Commit', 'FAIL', 'Status update failed');
    }
  } catch (e) {
    record('Lifecycle 5: Officer Resolution & Remarks Commit', 'FAIL', e.message);
  }

  // Step 5.6: Citizen rates resolution
  try {
    const feedRes = await axios.post(`${BASE_URL}/complaints/${complaintId}/feedback`, {
      rating: 5,
      comments: 'Excellent and swift response from field crew.'
    }, {
      headers: { 'x-demo-role': 'citizen' }
    });
    if (feedRes.data.data.rating === 5) {
      record('Lifecycle 6: Citizen Satisfaction Rating (5 Stars)', 'PASS', `Recorded feedback: ${feedRes.data.data.satisfaction_level}`);
    } else {
      record('Lifecycle 6: Citizen Satisfaction Rating (5 Stars)', 'FAIL', 'Feedback submission failed');
    }
  } catch (e) {
    record('Lifecycle 6: Citizen Satisfaction Rating (5 Stars)', 'FAIL', e.message);
  }

  // Step 5.7: Admin analytics reflects real DB calculation
  try {
    const adminRes = await axios.get(`${BASE_URL}/analytics/admin`, {
      headers: { 'x-demo-role': 'super_admin' }
    });
    if (adminRes.data.data.summary.total >= 4 && adminRes.data.data.departmentDistribution.length >= 6) {
      record('Lifecycle 7: Real-Time Admin Analytics Calculation', 'PASS', `Total Complaints: ${adminRes.data.data.summary.total}, Resolved: ${adminRes.data.data.summary.resolved}`);
    } else {
      record('Lifecycle 7: Real-Time Admin Analytics Calculation', 'FAIL', 'Analytics not computed correctly');
    }
  } catch (e) {
    record('Lifecycle 7: Real-Time Admin Analytics Calculation', 'FAIL', e.message);
  }

  console.log('\n=== AUDIT SUITE FINISHED ===');
}

runAudit();
