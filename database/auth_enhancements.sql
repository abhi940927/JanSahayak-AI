-- ==============================================================================
-- JANSAHAYAK AI - AUTHENTICATION & MULTI-ROLE SECURITY ENHANCEMENTS
-- ==============================================================================

-- 1. Add DOB and Multi-Role support to public.profiles if not present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['citizen']::TEXT[];

-- 2. Admin Invitations Table (Controlled Bootstrap & Onboarding)
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

-- Enable RLS on admin_invitations
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only super admins can view/create invitations
CREATE POLICY "Super admins manage invitations"
ON public.admin_invitations
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'super_admin' OR 'super_admin' = ANY(roles))
    )
);

-- 3. Provisioning Designated Multi-Role Administrator (abhisingh940927@gmail.com)
-- Note: When the user signs up with Supabase Auth with this email, this trigger automatically
-- grants both 'super_admin' and 'department_admin' roles securely.
CREATE OR REPLACE FUNCTION public.handle_admin_provisioning()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email = 'abhisingh940927@gmail.com' THEN
        NEW.role := 'super_admin';
        NEW.roles := ARRAY['super_admin', 'department_admin']::TEXT[];
        NEW.designation := 'Principal System Administrator & Nodal Director';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_provision_admin ON public.profiles;
CREATE TRIGGER trg_provision_admin
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_admin_provisioning();
