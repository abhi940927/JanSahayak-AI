-- ==============================================================================
-- JANSAHAYAK AI - MASTER PRODUCTION SEED DATA
-- ==============================================================================

-- 1. Insert Core Government Departments
INSERT INTO public.departments (id, name, code, description, contact_email, contact_phone, sla_hours_default)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Municipal Corporation & Sanitation', 'MCD', 'Civic amenities, garbage clearance, road maintenance, and urban sanitation.', 'mcd-support@jansahayak.gov.in', '+91 11 2322 0001', 48),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Public Works Department (PWD)', 'PWD', 'State highways, flyovers, drainage systems, and government building construction.', 'pwd-helpline@jansahayak.gov.in', '+91 11 2322 0002', 72),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Electricity & Power Distribution', 'EPD', 'Power outages, transformer faults, street lighting, and billing disputes.', 'power-support@jansahayak.gov.in', '+91 11 2322 0003', 24),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Water Supply & Sewerage Board', 'DJB', 'Drinking water pipelines, water contamination, sewer blockage, and tankers.', 'water-grievance@jansahayak.gov.in', '+91 11 2322 0004', 36),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Traffic & Transport Department', 'TPD', 'Traffic congestion, signal breakdown, public bus transport, and road safety.', 'traffic-aid@jansahayak.gov.in', '+91 11 2322 0005', 48),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Health & Family Welfare', 'HFW', 'Government hospital services, primary health clinics, epidemic control, and ambulances.', 'health-support@jansahayak.gov.in', '+91 11 2322 0006', 24)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sla_hours_default = EXCLUDED.sla_hours_default;

-- 2. Insert Standard Categories for Departments
INSERT INTO public.categories (id, department_id, name, code, description, default_priority, sla_hours)
VALUES
    -- Municipal Corporation & Sanitation
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Uncollected Garbage & Waste Accumulation', 'MCD_GARBAGE', 'Public waste dumping or uncollected household trash.', 'medium', 48),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Stray Animal Nuisance & Control', 'MCD_STRAY', 'Issues regarding stray animals posing risk or nuisance.', 'low', 72),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Illegal Encroachment on Footpath', 'MCD_ENCROACH', 'Footpath blockages by illegal stalls or constructions.', 'medium', 96),

    -- Public Works Department (PWD)
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Potholes & Broken Roads', 'PWD_POTHOLE', 'Dangerous potholes, road cave-ins, and uneven surfacing.', 'high', 72),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Open Storm Drainage / Manhole Hazard', 'PWD_MANHOLE', 'Uncovered manholes or collapsed storm drains.', 'critical', 12),

    -- Electricity & Power Distribution
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Prolonged Area Power Outage', 'EPD_BLACKOUT', 'Extended blackout affecting residential or commercial zones.', 'high', 12),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Exposed Electrical Wires / Sparking Transformer', 'EPD_HAZARD', 'Critical safety risk due to dangling electric cables or sparking transformer.', 'critical', 6),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c08', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Non-Functional Streetlights', 'EPD_STREETLIGHT', 'Dark street stretches due to broken light fixtures.', 'medium', 48),

    -- Water Supply & Sewerage Board
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Contaminated Drinking Water', 'DJB_CONTAM', 'Discolored, foul-smelling, or toxic tap water supply.', 'critical', 12),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Pipeline Leakage / Main Burst', 'DJB_LEAK', 'Tons of clean drinking water gushing onto roads.', 'high', 24),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Overflowing Sewage Line', 'DJB_SEWAGE', 'Sewage backflow on residential roads or basements.', 'high', 24),

    -- Traffic & Transport Department
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Traffic Signal Malfunction', 'TPD_SIGNAL', 'Blinking or dead junction traffic signals causing jams.', 'high', 12),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Illegal Parking & Bottleneck', 'TPD_PARKING', 'Vehicles obstructing primary emergency ambulance or transit routes.', 'medium', 48),

    -- Health & Family Welfare
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Government Clinic Staff Negligence', 'HFW_STAFF', 'Lack of attending medical doctors or emergency assistance.', 'high', 24),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Mosquito Breeding / Vector-Borne Threat', 'HFW_MOSQUITO', 'Stagnant water pools causing dengue/malaria outbreak risks.', 'high', 48)
ON CONFLICT (department_id, name) DO NOTHING;

-- 3. Realistic Evaluation Profiles (Mapped to UUIDs)
-- Note: When deployed in Supabase Auth, these UUIDs align with auth.users records
INSERT INTO public.profiles (id, email, full_name, phone_number, role, roles, department_id, designation, dob)
VALUES
    -- Super Admin
    ('00000000-0000-0000-0000-000000000001', 'admin.nodal@jansahayak.gov.in', 'Dr. Anandita Sharma', '+91 98100 12345', 'super_admin', ARRAY['super_admin', 'department_admin']::TEXT[], NULL, 'Principal Director & Chief Grievance Officer', '1982-04-15'),
    
    -- Department Admin (PWD)
    ('00000000-0000-0000-0000-000000000002', 'deptadmin.pwd@jansahayak.gov.in', 'Vikramaditya Rathore', '+91 98100 23456', 'department_admin', ARRAY['department_admin']::TEXT[], 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Superintending Engineer & Dept Administrator', '1985-08-22'),
    
    -- Field Officer (MCD)
    ('00000000-0000-0000-0000-000000000003', 'officer.rajesh@jansahayak.gov.in', 'Rajesh Verma', '+91 98100 34567', 'officer', ARRAY['officer']::TEXT[], 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Senior Sanitary Field Inspector', '1990-11-05'),
    
    -- Citizen
    ('00000000-0000-0000-0000-000000000004', 'citizen.priya@example.com', 'Priya Deshmukh', '+91 98765 43210', 'citizen', ARRAY['citizen']::TEXT[], NULL, 'Resident Citizen', '1996-03-12')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    designation = EXCLUDED.designation,
    department_id = EXCLUDED.department_id,
    roles = EXCLUDED.roles;

-- 4. Multi-Role Assignments in public.user_roles
INSERT INTO public.user_roles (user_id, role, department_id)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'super_admin', NULL),
    ('00000000-0000-0000-0000-000000000001', 'department_admin', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('00000000-0000-0000-0000-000000000002', 'department_admin', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('00000000-0000-0000-0000-000000000003', 'officer', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('00000000-0000-0000-0000-000000000004', 'citizen', NULL)
ON CONFLICT (user_id, role, department_id) DO NOTHING;

-- 5. Realistic Sample Grievances Across Lifecycle States
INSERT INTO public.complaints (
    id, 
    tracking_number, 
    citizen_id, 
    department_id, 
    category_id, 
    title, 
    description, 
    status, 
    priority, 
    address, 
    city, 
    state, 
    pincode, 
    latitude, 
    longitude, 
    sla_due_at
)
VALUES
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
        'GRV-2026-MCD-001',
        '00000000-0000-0000-0000-000000000004',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
        'Severe Waste Accumulation at Block B Community Market',
        'Large uncollected garbage heap near the community market gate is causing severe health concerns and foul odor.',
        'assigned',
        'medium',
        'Block B Market, Sector 14',
        'New Delhi',
        'Delhi',
        '110001',
        28.6139,
        77.2090,
        timezone('utc'::text, now()) + INTERVAL '48 hours'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02',
        'GRV-2026-PWD-002',
        '00000000-0000-0000-0000-000000000004',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04',
        'Dangerous Deep Pothole on Outer Ring Road Underpass',
        'Deep cave-in crater on the left lane near the underpass has damaged multiple two-wheelers during evening rush hour.',
        'in_progress',
        'high',
        'Outer Ring Road Underpass, Gate 3',
        'New Delhi',
        'Delhi',
        '110025',
        28.5355,
        77.2410,
        timezone('utc'::text, now()) + INTERVAL '24 hours'
    )
ON CONFLICT (tracking_number) DO NOTHING;

-- 6. Assignments for Active Grievances
INSERT INTO public.complaint_assignments (complaint_id, officer_id, assigned_by, assignment_status, notes)
VALUES
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        'assigned',
        'Assigned to Sanitary Inspector Rajesh Verma for site clearance.'
    )
ON CONFLICT DO NOTHING;
