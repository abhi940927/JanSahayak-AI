import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function runDynamicProfileTests() {
  console.log('====================================================');
  console.log('🧪 JANSAHAYAK AI - DYNAMIC USER PROFILE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? ': ' + details : ''}`);
      failed++;
    }
  }

  // --- TEST 1: Register Account A (Abhinav Singh) ---
  console.log('--- Test 1: Registering Citizen Account A (Abhinav Singh) ---');
  let tokenA = null;
  let userA = null;
  const emailA = `abhinav.citizen.${Date.now()}@example.in`;

  try {
    const resA = await axios.post(`${BASE_URL}/auth/register`, {
      full_name: 'Abhinav Singh',
      email: emailA,
      phone_number: '+91 98765 00001',
      dob: '1995-09-27',
      avatar_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="teal"/></svg>',
      password: 'StrongCitizenPass2026@',
      confirm_password: 'StrongCitizenPass2026@'
    });

    assert(resA.data.success === true, 'Account A Registration Status');
    assert(resA.data.data.user.full_name === 'Abhinav Singh', 'Account A Full Name Matches', resA.data.data.user.full_name);
    assert(resA.data.data.user.email === emailA, 'Account A Email Matches', resA.data.data.user.email);
    assert(resA.data.data.user.dob === '1995-09-27', 'Account A Date of Birth Matches', resA.data.data.user.dob);
    assert(Boolean(resA.data.data.token), 'Account A Issued Valid Token');

    tokenA = resA.data.data.token;
    userA = resA.data.data.user;
  } catch (err) {
    assert(false, 'Account A Registration', err.response?.data?.message || err.message);
  }

  // --- TEST 2: Register Account B (Priya Patel) ---
  console.log('\n--- Test 2: Registering Citizen Account B (Priya Patel) ---');
  let tokenB = null;
  let userB = null;
  const emailB = `priya.patel.${Date.now()}@example.in`;

  try {
    const resB = await axios.post(`${BASE_URL}/auth/register`, {
      full_name: 'Priya Patel',
      email: emailB,
      phone_number: '+91 98765 00002',
      dob: '1998-04-12',
      avatar_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="orange"/></svg>',
      password: 'AnotherCitizenPass2026@',
      confirm_password: 'AnotherCitizenPass2026@'
    });

    assert(resB.data.success === true, 'Account B Registration Status');
    assert(resB.data.data.user.full_name === 'Priya Patel', 'Account B Full Name Matches', resB.data.data.user.full_name);
    assert(resB.data.data.user.email === emailB, 'Account B Email Matches', resB.data.data.user.email);
    assert(resB.data.data.user.dob === '1998-04-12', 'Account B Date of Birth Matches', resB.data.data.user.dob);
    assert(Boolean(resB.data.data.token), 'Account B Issued Valid Token');

    tokenB = resB.data.data.token;
    userB = resB.data.data.user;
  } catch (err) {
    assert(false, 'Account B Registration', err.response?.data?.message || err.message);
  }

  // --- TEST 3: Retrieve Profile A Using Token A ---
  console.log('\n--- Test 3: Authenticated Profile Retrieval for Account A ---');
  try {
    const profileResA = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert(profileResA.data.success === true, 'Profile A Query Status');
    assert(profileResA.data.data.full_name === 'Abhinav Singh', 'Profile A Returns Abhinav Singh');
    assert(profileResA.data.data.email === emailA, 'Profile A Returns Correct Email');
    assert(profileResA.data.data.dob === '1995-09-27', 'Profile A Returns Correct DOB');
    assert(profileResA.data.data.phone_number === '+91 98765 00001', 'Profile A Returns Correct Phone');
  } catch (err) {
    assert(false, 'Profile A Retrieval', err.response?.data?.message || err.message);
  }

  // --- TEST 4: Retrieve Profile B Using Token B ---
  console.log('\n--- Test 4: Authenticated Profile Retrieval for Account B ---');
  try {
    const profileResB = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    assert(profileResB.data.success === true, 'Profile B Query Status');
    assert(profileResB.data.data.full_name === 'Priya Patel', 'Profile B Returns Priya Patel');
    assert(profileResB.data.data.email === emailB, 'Profile B Returns Correct Email');
    assert(profileResB.data.data.dob === '1998-04-12', 'Profile B Returns Correct DOB');
    assert(profileResB.data.data.phone_number === '+91 98765 00002', 'Profile B Returns Correct Phone');
  } catch (err) {
    assert(false, 'Profile B Retrieval', err.response?.data?.message || err.message);
  }

  // --- TEST 5: Complete Data Isolation Verification ---
  console.log('\n--- Test 5: Verify Complete Isolation Between Accounts ---');
  try {
    const checkA = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const checkB = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });

    assert(checkA.data.data.id !== checkB.data.data.id, 'Distinct Account UUIDs');
    assert(checkA.data.data.full_name !== checkB.data.data.full_name, 'Distinct Names');
    assert(checkA.data.data.email !== checkB.data.data.email, 'Distinct Emails');
    assert(checkA.data.data.avatar_url !== checkB.data.data.avatar_url, 'Distinct Avatar URLs');
  } catch (err) {
    assert(false, 'Data Isolation Check', err.message);
  }

  // --- TEST 6: Profile Modification & Immediate Persistence ---
  console.log('\n--- Test 6: Modifying Profile for Account A and Verifying Persistence ---');
  try {
    const updateRes = await axios.patch(
      `${BASE_URL}/profile`,
      {
        full_name: 'Abhinav Singh (Verified)',
        phone_number: '+91 99887 76655',
        dob: '1995-09-28'
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    assert(updateRes.data.success === true, 'Profile Update Call Succeeded');
    assert(updateRes.data.data.full_name === 'Abhinav Singh (Verified)', 'Updated Name Reflected in Response');

    // Query /profile again with tokenA to ensure persistence
    const recheck = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert(recheck.data.data.full_name === 'Abhinav Singh (Verified)', 'Persisted Name Verified on Reload');
    assert(recheck.data.data.phone_number === '+91 99887 76655', 'Persisted Phone Verified on Reload');
    assert(recheck.data.data.dob === '1995-09-28', 'Persisted DOB Verified on Reload');
  } catch (err) {
    assert(false, 'Profile Update Persistence', err.response?.data?.message || err.message);
  }

  // --- TEST 7: Security - Role Escalation Prevention ---
  console.log('\n--- Test 7: Security Check - Attempting Unauthorized Role Escalation ---');
  try {
    await axios.patch(
      `${BASE_URL}/profile`,
      { role: 'super_admin', designation: 'Supreme Ruler' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(false, 'Security Role Escalation Prevention', 'API erroneously allowed citizen to modify their own role');
  } catch (err) {
    assert(err.response?.status === 403, 'Role Escalation Blocked with HTTP 403 Forbidden', err.response?.data?.message);
  }

  // --- TEST 8: Password Change Endpoint ---
  console.log('\n--- Test 8: Password Change Endpoint ---');
  try {
    const pwRes = await axios.post(
      `${BASE_URL}/profile/change-password`,
      {
        current_password: 'StrongCitizenPass2026@',
        new_password: 'NewStrongPassword2026#',
        confirm_password: 'NewStrongPassword2026#'
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    assert(pwRes.data.success === true, 'Password Change Succeeded', pwRes.data.message);
  } catch (err) {
    assert(false, 'Password Change', err.response?.data?.message || err.message);
  }

  // --- TEST 9: Multi-Role Account Switching (abhisingh940927@gmail.com) ---
  console.log('\n--- Test 9: Multi-Role Account Login & Dynamic Switching ---');
  try {
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'abhisingh940927@gmail.com',
      password: 'AnyPasswordForAdmin@demo'
    });

    assert(adminLoginRes.data.success === true, 'Admin Login Succeeded');
    assert(adminLoginRes.data.data.available_roles.includes('super_admin'), 'Super Admin Role Present');
    assert(adminLoginRes.data.data.available_roles.includes('department_admin'), 'Dept Admin Role Present');
    assert(adminLoginRes.data.data.requires_role_selection === true, 'Requires Role Selection Flagged');

    const adminToken = adminLoginRes.data.data.token;

    // Switch role to department_admin
    const switchRes = await axios.post(
      `${BASE_URL}/auth/switch-role`,
      { target_role: 'department_admin' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    assert(switchRes.data.success === true, 'Role Switched to Department Admin');
    assert(switchRes.data.data.user.role === 'department_admin', 'Active Role Is department_admin');
  } catch (err) {
    assert(false, 'Multi-Role Admin Switching', err.response?.data?.message || err.message);
  }

  // --- SUMMARY ---
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDynamicProfileTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
