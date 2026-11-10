-- ==============================================================================
-- JANSAHAYAK AI - AUTHENTICATION & MULTI-ROLE SECURITY ENHANCEMENTS
-- ==============================================================================

-- 1. Add DOB and Multi-Role support to public.profiles if not present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path TEXT;
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

-- 3. Controlled Onboarding via Invitation Redemption
CREATE OR REPLACE FUNCTION public.redeem_admin_invitation(p_invitation_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_inv RECORD;
    v_user_id UUID;
    v_email TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Authentication required');
    END IF;

    SELECT email INTO v_email FROM public.profiles WHERE id = v_user_id;

    SELECT * INTO v_inv FROM public.admin_invitations
    WHERE invitation_code = p_invitation_code 
      AND email = v_email
      AND is_used = false 
      AND expires_at > now();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid, expired, or unauthorized invitation code');
    END IF;

    -- Assign role in user_roles table
    INSERT INTO public.user_roles (user_id, role, department_id, assigned_by)
    VALUES (v_user_id, v_inv.role, v_inv.department_id, v_inv.invited_by)
    ON CONFLICT (user_id, role, department_id) DO NOTHING;

    -- Mark invitation as used
    UPDATE public.admin_invitations
    SET is_used = true
    WHERE id = v_inv.id;

    RETURN jsonb_build_object('success', true, 'message', 'Administrative role successfully assigned', 'role', v_inv.role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Clean up any legacy hardcoded email triggers
DROP TRIGGER IF EXISTS trg_provision_admin ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_admin_provisioning();
