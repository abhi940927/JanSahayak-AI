-- ==============================================================================
-- JANSAHAYAK AI - MASTER SUPABASE COMPLETE DATABASE SETUP SCRIPT
-- Run this entire script in Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'citizen',
        'officer',
        'department_admin',
        'super_admin'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_status AS ENUM (
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
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complaint_priority AS ENUM (
        'critical',
        'high',
        'medium',
        'low'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM (
        'assigned',
        'accepted',
        'delegated',
        'completed',
        'reassigned'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE escalation_status AS ENUM (
        'triggered',
        'reviewed',
        'resolved',
        'dismissed'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. CORE TABLES
-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    sla_hours_default INTEGER NOT NULL DEFAULT 72,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Profiles (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    role user_role NOT NULL DEFAULT 'citizen',
    roles TEXT[] DEFAULT ARRAY['citizen']::TEXT[],
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    designation VARCHAR(100),
    dob DATE,
    avatar_url TEXT,
    avatar_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- User Roles (Multi-Role Relationship)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_role_dept UNIQUE (user_id, role, department_id)
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    default_priority complaint_priority NOT NULL DEFAULT 'medium',
    sla_hours INTEGER NOT NULL DEFAULT 72,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(department_id, name)
);

-- Complaints
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number VARCHAR(30) NOT NULL UNIQUE,
    citizen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    status complaint_status NOT NULL DEFAULT 'submitted',
    priority complaint_priority NOT NULL DEFAULT 'medium',
    is_escalated BOOLEAN NOT NULL DEFAULT false,
    escalation_level INTEGER NOT NULL DEFAULT 0,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    sla_due_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    reopen_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Complaint Assignments
CREATE TABLE IF NOT EXISTS public.complaint_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assignment_status assignment_status NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Complaint History (Immutable Audit Log)
CREATE TABLE IF NOT EXISTS public.complaint_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    from_status complaint_status,
    to_status complaint_status NOT NULL,
    action VARCHAR(100) NOT NULL,
    remarks TEXT,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Complaint Attachments
CREATE TABLE IF NOT EXISTS public.complaint_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    is_resolution_proof BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- AI Predictions
CREATE TABLE IF NOT EXISTS public.ai_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    predicted_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    predicted_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    predicted_priority complaint_priority,
    confidence_score NUMERIC(5,4) NOT NULL,
    suggested_summary TEXT,
    detected_language VARCHAR(20),
    sentiment VARCHAR(30),
    is_reviewed_by_human BOOLEAN NOT NULL DEFAULT false,
    review_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Duplicate Matches
CREATE TABLE IF NOT EXISTS public.duplicate_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    potential_duplicate_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    similarity_score NUMERIC(5,4) NOT NULL,
    distance_meters NUMERIC(10,2),
    time_difference_hours NUMERIC(10,2),
    status VARCHAR(50) NOT NULL DEFAULT 'detected',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_duplicate_pair UNIQUE(primary_complaint_id, potential_duplicate_id)
);

-- Escalations
CREATE TABLE IF NOT EXISTS public.escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    escalation_level INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    status escalation_status NOT NULL DEFAULT 'triggered',
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ,
    action_taken TEXT,
    handled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'status_update',
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL UNIQUE REFERENCES public.complaints(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    satisfaction_level VARCHAR(50),
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Admin Invitations
CREATE TABLE IF NOT EXISTS public.admin_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    invitation_code VARCHAR(100) NOT NULL UNIQUE,
    role user_role NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
    ('complaint-attachments', 'complaint-attachments', false, 15728640, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'image/heic'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. SECURITY DEFINER HELPER FUNCTIONS (RECURSION-SAFE)
CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, target_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = target_role
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.has_role(auth.uid(), 'super_admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_departments(user_uuid UUID)
RETURNS TABLE (dept_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT department_id FROM public.user_roles 
    WHERE user_id = user_uuid AND department_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_super_admin());

-- User Roles Policies
DROP POLICY IF EXISTS "User roles view policy" ON public.user_roles;
CREATE POLICY "User roles view policy" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admin manage user roles" ON public.user_roles;
CREATE POLICY "Super admin manage user roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_super_admin());

-- Departments & Categories Policies
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Super admins manage departments" ON public.departments;
CREATE POLICY "Super admins manage departments" ON public.departments FOR ALL TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_super_admin() OR public.has_role(auth.uid(), 'department_admin'));

-- Complaints Policies
DROP POLICY IF EXISTS "Complaints select policy" ON public.complaints;
CREATE POLICY "Complaints select policy" ON public.complaints FOR SELECT TO authenticated USING (
    citizen_id = auth.uid()
    OR public.is_super_admin()
    OR department_id IN (SELECT dept_id FROM public.get_user_departments(auth.uid()))
    OR EXISTS (SELECT 1 FROM public.complaint_assignments WHERE complaint_id = public.complaints.id AND officer_id = auth.uid())
);

DROP POLICY IF EXISTS "Complaints insert policy" ON public.complaints;
CREATE POLICY "Complaints insert policy" ON public.complaints FOR INSERT TO authenticated WITH CHECK (citizen_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Complaints update policy" ON public.complaints;
CREATE POLICY "Complaints update policy" ON public.complaints FOR UPDATE TO authenticated USING (
    public.is_super_admin()
    OR department_id IN (SELECT dept_id FROM public.get_user_departments(auth.uid()))
    OR EXISTS (SELECT 1 FROM public.complaint_assignments WHERE complaint_id = public.complaints.id AND officer_id = auth.uid())
    OR (citizen_id = auth.uid() AND status IN ('submitted', 'reopened'))
);

-- Storage Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public Profile Photos Access" ON storage.objects;
    CREATE POLICY "Public Profile Photos Access" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);
    DROP POLICY IF EXISTS "Authenticated users view complaint attachments" ON storage.objects;
    CREATE POLICY "Authenticated users view complaint attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'complaint-attachments');
    DROP POLICY IF EXISTS "Authenticated users upload complaint attachments" ON storage.objects;
    CREATE POLICY "Authenticated users upload complaint attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'complaint-attachments');
EXCEPTION WHEN undefined_table THEN null;
END $$;

-- 7. TRIGGERS & AUTOMATION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_departments_updated_at ON public.departments;
CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_complaints_updated_at ON public.complaints;
CREATE TRIGGER trg_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto record complaint history
CREATE OR REPLACE FUNCTION public.record_complaint_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.complaint_history (complaint_id, performed_by, from_status, to_status, action, remarks)
        VALUES (NEW.id, COALESCE(auth.uid(), NEW.citizen_id), NULL, NEW.status, 'Grievance Registered', 'Complaint registered via JanSahayak Portal');
    ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
        INSERT INTO public.complaint_history (complaint_id, performed_by, from_status, to_status, action, remarks)
        VALUES (NEW.id, auth.uid(), OLD.status, NEW.status, 'Status Changed To ' || replace(initcap(replace(NEW.status::TEXT, '_', ' ')), ' ', ' '), 'Workflow progression update');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_complaint_history_record ON public.complaints;
CREATE TRIGGER trg_complaint_history_record AFTER INSERT OR UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.record_complaint_history();

-- 8. INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON public.complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON public.complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_tracking ON public.complaints(tracking_number);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_complaint ON public.complaint_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- 9. INITIAL SEED DATA
-- Core Departments
INSERT INTO public.departments (id, name, code, description, contact_email, contact_phone, sla_hours_default)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Municipal Corporation & Sanitation', 'MCD', 'Civic amenities, garbage clearance, road maintenance, and urban sanitation.', 'mcd-support@jansahayak.gov.in', '+91 11 2322 0001', 48),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Public Works Department (PWD)', 'PWD', 'State highways, flyovers, drainage systems, and government building construction.', 'pwd-helpline@jansahayak.gov.in', '+91 11 2322 0002', 72),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Electricity & Power Distribution', 'EPD', 'Power outages, transformer faults, street lighting, and billing disputes.', 'power-support@jansahayak.gov.in', '+91 11 2322 0003', 24),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Water Supply & Sewerage Board', 'DJB', 'Drinking water pipelines, water contamination, sewer blockage, and tankers.', 'water-grievance@jansahayak.gov.in', '+91 11 2322 0004', 36),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Traffic & Transport Department', 'TPD', 'Traffic congestion, signal breakdown, public bus transport, and road safety.', 'traffic-aid@jansahayak.gov.in', '+91 11 2322 0005', 48),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Health & Family Welfare', 'HFW', 'Government hospital services, primary health clinics, epidemic control, and ambulances.', 'health-support@jansahayak.gov.in', '+91 11 2322 0006', 24)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Core Categories
INSERT INTO public.categories (id, department_id, name, code, description, default_priority, sla_hours)
VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Uncollected Garbage & Waste Accumulation', 'MCD_GARBAGE', 'Public waste dumping or uncollected household trash.', 'medium', 48),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Stray Animal Nuisance & Control', 'MCD_STRAY', 'Issues regarding stray animals posing risk or nuisance.', 'low', 72),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Potholes & Broken Roads', 'PWD_POTHOLE', 'Dangerous potholes, road cave-ins, and uneven surfacing.', 'high', 72),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Open Storm Drainage / Manhole Hazard', 'PWD_MANHOLE', 'Uncovered manholes or collapsed storm drains.', 'critical', 12),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Prolonged Area Power Outage', 'EPD_BLACKOUT', 'Extended blackout affecting residential or commercial zones.', 'high', 12),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Exposed Electrical Wires / Sparking Transformer', 'EPD_HAZARD', 'Critical safety risk due to dangling electric cables.', 'critical', 6),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Contaminated Drinking Water', 'DJB_CONTAM', 'Discolored, foul-smelling, or toxic tap water supply.', 'critical', 12),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Pipeline Leakage / Main Burst', 'DJB_LEAK', 'Drinking water gushing onto roads.', 'high', 24)
ON CONFLICT (department_id, name) DO NOTHING;
