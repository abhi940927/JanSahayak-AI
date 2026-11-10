import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5001/api';

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🧪 JANSAHAYAK AI - SUPABASE DATABASE INTEGRATION TEST SUITE');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // --- TEST 1: Schema Migrations Files Validation ---
  console.log('\n--- Category 1: Schema Migration File Integrity ---');
  const migrationFiles = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/002_multi_role_and_workflow_expansion.sql',
    'supabase/migrations/003_storage_buckets_and_rls.sql',
    'supabase/migrations/004_complete_rls_policies.sql',
    'supabase/migrations/005_automation_triggers_and_indexes.sql',
    'supabase/seed.sql',
    'supabase/migrations/rollbacks/002_rollback.sql',
    'supabase/migrations/rollbacks/003_rollback.sql',
    'supabase/migrations/rollbacks/004_rollback.sql',
    'supabase/migrations/rollbacks/005_rollback.sql'
  ];

  for (const file of migrationFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    assert(fs.existsSync(fullPath), `Migration file exists: ${file}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert(content.length > 50, `Migration file has valid content: ${file} (${content.length} bytes)`);
  }

  // --- TEST 2: Dynamic Citizen Registration ---
  console.log('\n--- Category 2: Dynamic Citizen Registration & Profile Isolation ---');
  const uniqueEmail = `test.citizen.${Date.now()}@example.com`;
  const registerPayload = {
    full_name: 'Pooja Bhattacharya',
    email: uniqueEmail,
    password: 'SecurePassword2026@',
    confirm_password: 'SecurePassword2026@',
    dob: '1998-07-21',
    phone_number: '+91 98765 11223',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
  };

  const regRes = await axios.post(`${API_BASE}/auth/register`, registerPayload);
  assert(regRes.data.success === true, 'Registration API returns success');
  assert(regRes.data.data.user.full_name === 'Pooja Bhattacharya', 'Dynamic full name correctly saved (Pooja Bhattacharya)');
  assert(regRes.data.data.user.email === uniqueEmail, 'Dynamic email correctly saved');
  assert(regRes.data.data.user.dob === '1998-07-21', 'Dynamic date of birth correctly stored');
  assert(regRes.data.data.user.role === 'citizen', 'Default role is citizen');
  assert(Array.isArray(regRes.data.data.user.roles), 'User roles is returned as an array');

  // --- TEST 3: Dynamic Citizen Login & Token Verification ---
  console.log('\n--- Category 3: Dynamic Authentication & Session Verification ---');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: uniqueEmail,
    password: 'SecurePassword2026@'
  });
  assert(loginRes.data.success === true, 'Login API returns success for newly registered user');
  const citizenToken = loginRes.data.data.token;
  assert(Boolean(citizenToken), 'Authentication token received');
  assert(loginRes.data.data.user.full_name === 'Pooja Bhattacharya', 'Logged-in user is Pooja, never hardcoded');
  assert(loginRes.data.data.user.email === uniqueEmail, 'Logged-in email is unique registered email');

  // --- TEST 4: Profile Profile Retrieval & Verification ---
  console.log('\n--- Category 4: Authenticated Profile Fetch ---');
  const profileRes = await axios.get(`${API_BASE}/auth/profile`, {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(profileRes.data.success === true, 'Get profile API returns success');
  assert(profileRes.data.data.full_name === 'Pooja Bhattacharya', 'Profile matches authenticated user full name');
  assert(profileRes.data.data.dob === '1998-07-21', 'Profile matches authenticated user DOB');

  // --- TEST 5: Profile Update & Immediate Reflection ---
  console.log('\n--- Category 5: Profile Update & Immediate Reflection ---');
  const updateRes = await axios.put(`${API_BASE}/auth/profile`, {
    full_name: 'Dr. Pooja Bhattacharya-Sharma',
    phone_number: '+91 99887 76655',
    dob: '1998-07-21',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2'
  }, {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(updateRes.data.success === true, 'Profile update returns success');
  assert(updateRes.data.data.full_name === 'Dr. Pooja Bhattacharya-Sharma', 'Full name immediately updated to Dr. Pooja Bhattacharya-Sharma');
  assert(updateRes.data.data.phone_number === '+91 99887 76655', 'Phone number updated');

  // --- TEST 6: Grievance Lifecycle Filing & Stepper Status Transitions ---
  console.log('\n--- Category 6: Grievance Lifecycle Progression ---');
  const grievancePayload = {
    title: 'Severe sewer overflow at Block C Residential Lane',
    description: 'Black wastewater overflowing across the entire residential street since yesterday morning.',
    address: 'Block C, Street 4, Vasant Kunj',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110070',
    latitude: 28.5244,
    longitude: 77.1587,
    preferred_language: 'en'
  };

  const fileRes = await axios.post(`${API_BASE}/complaints`, grievancePayload, {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(fileRes.data.success === true, 'Grievance submission returns success');
  const createdComplaint = fileRes.data.data;
  assert(createdComplaint.status === 'submitted', 'Initial complaint status is submitted');
  assert(Boolean(createdComplaint.tracking_number), 'Unique tracking number generated');

  // --- TEST 7: Multi-Role Officer Login & Status Transition ---
  console.log('\n--- Category 7: Officer Status Management & Stepper Update ---');
  // Login as Officer
  const officerLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'officer.pwd@jansahayak.gov.in',
    password: 'GovPass2026@demo',
    portal_context: 'officer'
  });
  assert(officerLogin.data.success === true, 'Officer login successful');
  const officerToken = officerLogin.data.data.token;
  assert(officerLogin.data.data.user.role === 'officer', 'Officer role active');

  // Transition to under_review / in_progress
  const statusUpdateRes = await axios.patch(
    `${API_BASE}/complaints/${createdComplaint.id}/status`,
    {
      status: 'in_progress',
      remarks: 'Sanitary inspection team dispatched on site.'
    },
    { headers: { Authorization: `Bearer ${officerToken}` } }
  );
  assert(statusUpdateRes.data.success === true, 'Status update to in_progress successful');
  assert(statusUpdateRes.data.data.status === 'in_progress', 'Grievance status transitioned to in_progress');

  // Transition to resolution_submitted
  const resolutionRes = await axios.patch(
    `${API_BASE}/complaints/${createdComplaint.id}/status`,
    {
      status: 'resolution_submitted',
      remarks: 'Sewer suction machines cleared blockage. Disinfectant sprayed.'
    },
    { headers: { Authorization: `Bearer ${officerToken}` } }
  );
  assert(resolutionRes.data.success === true, 'Status update to resolution_submitted successful');
  assert(resolutionRes.data.data.status === 'resolution_submitted', 'Grievance status is resolution_submitted');

  // --- TEST 8: Timeline & Audit History Verification ---
  console.log('\n--- Category 8: Audit Timeline History Verification ---');
  const detailRes = await axios.get(`${API_BASE}/complaints/${createdComplaint.id}`, {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert(detailRes.data.success === true, 'Complaint detail retrieved');
  assert(Array.isArray(detailRes.data.data.history), 'History timeline returned as array');
  assert(detailRes.data.data.history.length >= 2, `History records created for transitions (count: ${detailRes.data.data.history.length})`);

  // --- TEST 9: Citizen Feedback Submission ---
  console.log('\n--- Category 9: Citizen Feedback Verification ---');
  const feedbackRes = await axios.post(
    `${API_BASE}/complaints/${createdComplaint.id}/feedback`,
    {
      rating: 5,
      comments: 'Very fast resolution by the municipal team! Thank you.'
    },
    { headers: { Authorization: `Bearer ${citizenToken}` } }
  );
  assert(feedbackRes.data.success === true, 'Feedback recorded successfully');
  assert(feedbackRes.data.data.rating === 5, 'Feedback rating is 5 stars');

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} SUPABASE DATABASE INTEGRATION TESTS PASSED!`);
  console.log('===============================================================\n');
}

runTestSuite().catch(err => {
  console.error('\n❌ Test execution failed:', err.message);
  if (err.response) {
    console.error('Response status:', err.response.status);
    console.error('Response data:', err.response.data);
  }
  process.exit(1);
});
