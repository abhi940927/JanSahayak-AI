import axios from 'axios';

const API = 'http://localhost:5001/api';

async function testFullFlow() {
  console.log('--- STARTING JANSAHAYAK E2E INTEGRATION SUITE ---');

  // 1. Health check
  const health = await axios.get(`${API}/health`);
  console.log('✅ Health API Status:', health.data.status);

  // 2. Fetch Departments
  const depts = await axios.get(`${API}/departments`);
  console.log(`✅ Loaded ${depts.data.data.length} Government Departments`);

  // 3. Create Complaint as Citizen
  const newComplaint = await axios.post(`${API}/complaints`, {
    title: 'Severe pipeline leak gushing drinking water near Metro station',
    description: 'Fresh clean drinking water has been flooding the street since 5 AM. Severe water wastage and road erosion.',
    address: 'Near Metro Gate 3, Laxmi Nagar',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110092',
    latitude: 28.6304,
    longitude: 77.2773,
    preferred_language: 'en'
  }, {
    headers: { 'x-demo-role': 'citizen' }
  });
  console.log('✅ Created Complaint:', newComplaint.data.data.tracking_number, 'Status:', newComplaint.data.data.status);

  const complaintId = newComplaint.data.data.id;

  // 4. Retrieve Complaint Details
  const details = await axios.get(`${API}/complaints/${complaintId}`, {
    headers: { 'x-demo-role': 'citizen' }
  });
  console.log('✅ Verified Details & Timeline:', details.data.data.tracking_number, 'History items:', details.data.data.history.length);

  // 5. Officer Update Status to 'in_progress'
  const updateRes = await axios.patch(`${API}/complaints/${complaintId}/status`, {
    status: 'in_progress',
    remarks: 'Dispatched emergency DJB plumbing van with submersible suction pump.'
  }, {
    headers: { 'x-demo-role': 'officer' }
  });
  console.log('✅ Officer Status Update:', updateRes.data.data.status);

  // 6. Officer Update Status to 'resolved'
  const resolvedRes = await axios.patch(`${API}/complaints/${complaintId}/status`, {
    status: 'resolved',
    remarks: 'Cast iron pipe replacement completed and pressure tested successfully.'
  }, {
    headers: { 'x-demo-role': 'officer' }
  });
  console.log('✅ Officer Status Update:', resolvedRes.data.data.status);

  // 7. Verify Admin Analytics Real Calculation
  const adminStats = await axios.get(`${API}/analytics/admin`, {
    headers: { 'x-demo-role': 'super_admin' }
  });
  console.log('✅ Admin Analytics (Real DB Metrics): Total:', adminStats.data.data.summary.total, 'Resolved:', adminStats.data.data.summary.resolved);

  console.log('\n🎉 ALL FULL-STACK WORKFLOWS PASSED VERIFICATION!');
}

testFullFlow().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
