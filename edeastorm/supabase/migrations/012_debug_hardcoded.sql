
-- Migration: 012_debug_hardcoded.sql
-- Description: Temporary debug policy

CREATE POLICY "debug_me"
    ON public.organization_members FOR SELECT
    USING (user_id = 'aa291173-aa56-4e69-8342-921d07936316');
