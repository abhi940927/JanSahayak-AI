-- ==============================================================================
-- JANSAHAYAK AI - MIGRATION 002: MULTI-ROLE & WORKFLOW ENUM EXPANSION
-- ==============================================================================

-- 1. Safely Expand complaint_status Enum with Lifecycle States
DO $$
BEGIN
    ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS 'pending_information';
    ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS 'resolution_submitted';
    ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS 'escalated';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Enhance profiles table with profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['citizen']::TEXT[];

-- 3. Dedicated user_roles Table for Multi-Role Support
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_role_dept UNIQUE (user_id, role, department_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_dept ON public.user_roles(department_id);

-- 4. Initial Role Backfill from existing profiles
INSERT INTO public.user_roles (user_id, role, department_id)
SELECT id, role, department_id
FROM public.profiles
ON CONFLICT (user_id, role, department_id) DO NOTHING;

-- 5. Admin Invitations Table (Controlled Role Provisioning without hardcoding)
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

CREATE INDEX IF NOT EXISTS idx_invitations_email_code ON public.admin_invitations(email, invitation_code);

-- 6. Remove any legacy hardcoded email triggers
DROP TRIGGER IF EXISTS trg_provision_admin ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_admin_provisioning();
