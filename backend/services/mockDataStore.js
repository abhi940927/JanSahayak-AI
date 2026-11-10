import { v4 as uuidv4 } from 'uuid';

export const mockDepartments = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Municipal Corporation & Sanitation',
    code: 'MCD',
    description: 'Civic amenities, garbage clearance, road maintenance, and urban sanitation.',
    contact_email: 'mcd-support@jansahayak.gov.in',
    contact_phone: '+91 11 2322 0001',
    sla_hours_default: 48,
    is_active: true
  },
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    name: 'Public Works Department (PWD)',
    code: 'PWD',
    description: 'State highways, flyovers, drainage systems, and government building construction.',
    contact_email: 'pwd-helpline@jansahayak.gov.in',
    contact_phone: '+91 11 2322 0002',
    sla_hours_default: 72,
    is_active: true
  },
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    name: 'Electricity & Power Distribution',
    code: 'EPD',
    description: 'Power outages, transformer faults, street lighting, and billing disputes.',
    contact_email: 'power-support@jansahayak.gov.in',
    contact_phone: '+91 11 2322 0003',
    sla_hours_default: 24,
    is_active: true
  },
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    name: 'Water Supply & Sewerage Board',
    code: 'DJB',
    description: 'Drinking water pipelines, water contamination, sewer blockage, and tankers.',
    contact_email: 'water-grievance@jansahayak.gov.in',
    contact_phone: '+91 11 2322 0004',
    sla_hours_default: 36,
    is_active: true
  },
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    name: 'Traffic & Transport Department',
    code: 'TPD',
    description: 'Traffic congestion, signal breakdown, public bus transport, and road safety.',
    contact_email: 'traffic-aid@jansahayak.gov.in',
    contact_phone: '+91 11 2322 0005',
    sla_hours_default: 48,
    is_active: true
  },
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    name: 'Health & Family Welfare',
    code: 'HFW',
    description: 'Government hospital services, primary health clinics, epidemic control, and ambulances.',
    contact_email: 'health-support@jansahayak.gov.in',
    contact_phone: '+91 11 2322 0006',
    sla_hours_default: 24,
    is_active: true
  }
];

export const mockCategories = [
  {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Uncollected Garbage & Waste Accumulation',
    code: 'MCD_GARBAGE',
    description: 'Public waste dumping or uncollected household trash.',
    default_priority: 'medium',
    sla_hours: 48
  },
  {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04',
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    name: 'Potholes & Broken Roads',
    code: 'PWD_POTHOLE',
    description: 'Dangerous potholes, road cave-ins, and uneven surfacing.',
    default_priority: 'high',
    sla_hours: 72
  },
  {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05',
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    name: 'Open Storm Drainage / Manhole Hazard',
    code: 'PWD_MANHOLE',
    description: 'Uncovered manholes or collapsed storm drains.',
    default_priority: 'critical',
    sla_hours: 12
  },
  {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c06',
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    name: 'Prolonged Area Power Outage',
    code: 'EPD_BLACKOUT',
    description: 'Extended blackout affecting residential or commercial zones.',
    default_priority: 'high',
    sla_hours: 12
  },
  {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c09',
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    name: 'Contaminated Drinking Water',
    code: 'DJB_CONTAM',
    description: 'Discolored, foul-smelling, or toxic tap water supply.',
    default_priority: 'critical',
    sla_hours: 12
  }
];

export const mockUsers = [
  {
    id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u01',
    email: 'citizen@jansahayak.in',
    full_name: 'Aarav Sharma',
    phone_number: '+91 98765 43210',
    dob: '1992-05-14',
    avatar_url: null,
    role: 'citizen',
    roles: ['citizen'],
    department_id: null,
    designation: 'Citizen / Resident',
    is_active: true,
    created_at: '2026-01-15T08:30:00.000Z',
    updated_at: '2026-01-15T08:30:00.000Z'
  },
  {
    id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u02',
    email: 'officer.pwd@jansahayak.gov.in',
    full_name: 'Rajesh Verma',
    phone_number: '+91 98111 22334',
    dob: '1984-08-22',
    avatar_url: null,
    role: 'officer',
    roles: ['officer'],
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    designation: 'Executive Engineer - Zone 3 (PWD)',
    is_active: true,
    created_at: '2026-01-10T10:00:00.000Z',
    updated_at: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u03',
    email: 'admin.mcd@jansahayak.gov.in',
    full_name: 'Sunita Devi',
    phone_number: '+91 98222 33445',
    dob: '1979-11-03',
    avatar_url: null,
    role: 'department_admin',
    roles: ['department_admin'],
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    designation: 'Chief Nodal Officer - MCD',
    is_active: true,
    created_at: '2026-01-05T09:15:00.000Z',
    updated_at: '2026-01-05T09:15:00.000Z'
  },
  {
    id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u04',
    email: 'superadmin@jansahayak.gov.in',
    full_name: 'Dr. Anandita Sharma',
    phone_number: '+91 98100 12345',
    dob: '1982-04-15',
    avatar_url: null,
    role: 'super_admin',
    roles: ['super_admin', 'department_admin'],
    department_id: null,
    designation: 'Principal Director & Chief Grievance Officer',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  }
];

export const mockUserRoles = [
  { id: uuidv4(), user_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u01', role: 'citizen', department_id: null },
  { id: uuidv4(), user_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u02', role: 'officer', department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' },
  { id: uuidv4(), user_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u03', role: 'department_admin', department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
  { id: uuidv4(), user_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u04', role: 'super_admin', department_id: null },
  { id: uuidv4(), user_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u04', role: 'department_admin', department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' }
];

export const mockInvitations = [
  {
    code: 'JS-DEPT-ADMIN-2026',
    role: 'department_admin',
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    is_used: false
  },
  {
    code: 'JS-SUPER-ADMIN-2026',
    role: 'super_admin',
    department_id: null,
    is_used: false
  }
];

export const mockComplaints = [
  {
    id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    tracking_number: 'JS-2026-94821',
    citizen_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u01',
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    category_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04',
    title: 'Severe road cave-in on Outer Ring Road near Metro Pillar 114',
    description: 'A deep pothole / crater has collapsed the left lane. Commuters and bikers are at extreme accident risk during night hours.',
    preferred_language: 'en',
    status: 'in_progress',
    priority: 'high',
    is_escalated: false,
    escalation_level: 0,
    address: 'Near Metro Pillar 114, Outer Ring Road, Rohini Sector 14',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110085',
    latitude: 28.7159,
    longitude: 77.1147,
    sla_due_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    assigned_officer_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u02'
  },
  {
    id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
    tracking_number: 'JS-2026-38192',
    citizen_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u01',
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    category_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c09',
    title: 'Muddy and contaminated tap water supply in Sector 9',
    description: 'Tap water has been brown and foul smelling since yesterday morning. Families unable to use it for cooking or drinking.',
    preferred_language: 'en',
    status: 'assigned',
    priority: 'critical',
    is_escalated: false,
    escalation_level: 0,
    address: 'Pocket B, Block 3, Dwarka Sector 9',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110077',
    latitude: 28.5779,
    longitude: 77.0673,
    sla_due_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    assigned_officer_id: null
  },
  {
    id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
    tracking_number: 'JS-2026-11029',
    citizen_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u01',
    department_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    category_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    title: 'Overflowing dump container blocking colony entrance gate',
    description: 'Municipal garbage dump has not been cleared for 4 days. Waste spilled onto the street causing terrible odor and health risks.',
    preferred_language: 'en',
    status: 'resolved',
    priority: 'medium',
    is_escalated: false,
    escalation_level: 0,
    address: 'Near Gate 2, Mayur Vihar Phase 1',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110091',
    latitude: 28.6083,
    longitude: 77.2961,
    sla_due_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    assigned_officer_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u02'
  }
];

export const mockHistory = [
  {
    id: uuidv4(),
    complaint_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    from_status: null,
    to_status: 'submitted',
    action: 'Complaint Registered',
    remarks: 'Citizen filed grievance via JanSahayak Portal',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: uuidv4(),
    complaint_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    from_status: 'submitted',
    to_status: 'assigned',
    action: 'Officer Assigned',
    remarks: 'Auto-routed to PWD Executive Engineer based on location & category',
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  },
  {
    id: uuidv4(),
    complaint_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    from_status: 'assigned',
    to_status: 'in_progress',
    action: 'Inspection Initiated',
    remarks: 'Field team dispatched for crater patch inspection and traffic diversion setup.',
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  }
];

export const mockNotifications = [
  {
    id: uuidv4(),
    user_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u01',
    complaint_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    title: 'Grievance In Progress',
    message: 'Your complaint JS-2026-94821 is being actively addressed by PWD Engineering team.',
    type: 'status_update',
    is_read: false,
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: uuidv4(),
    user_id: 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u02',
    complaint_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
    title: 'New High Priority Assignment',
    message: 'Complaint JS-2026-94821 requires site inspection within 24 hours.',
    type: 'assignment',
    is_read: false,
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  }
];

// Dynamic In-Memory Store for Registered Users
export const dynamicUsers = new Map();

// Initialize dynamic users with mock users
mockUsers.forEach(u => {
  dynamicUsers.set(u.id, u);
  dynamicUsers.set(u.email.toLowerCase(), u);
});

export const findUserByIdOrEmail = (identifier) => {
  if (!identifier) return null;
  const lower = String(identifier).toLowerCase().trim();
  return dynamicUsers.get(identifier) ||
         dynamicUsers.get(lower) ||
         mockUsers.find(u => u.id === identifier || u.email.toLowerCase() === lower) ||
         null;
};

export const saveDynamicUser = (user) => {
  const normalized = {
    ...user,
    updated_at: new Date().toISOString()
  };
  dynamicUsers.set(user.id, normalized);
  dynamicUsers.set(user.email.toLowerCase().trim(), normalized);
  const idx = mockUsers.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase().trim());
  if (idx >= 0) {
    mockUsers[idx] = normalized;
  } else {
    mockUsers.push(normalized);
  }
  return normalized;
};
