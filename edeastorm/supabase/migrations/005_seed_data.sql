-- Edeastorm Seed Data
-- Migration: 005_seed_data.sql
-- Description: Creates initial organization and demo data

--------------------------------------------
-- DEFAULT ORGANIZATION
--------------------------------------------
-- Create a default organization for public/demo boards
INSERT INTO public.organizations (id, name, slug, allowed_domains, logo_url)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Edeastorm Demo',
    'demo',
    ARRAY['gmail.com', 'outlook.com', 'yahoo.com'], -- Allow common email providers for demo
    NULL
)
ON CONFLICT (slug) DO NOTHING;

--------------------------------------------
-- DEMO BOARD (Optional)
--------------------------------------------
-- This will be created once a user signs up, but we can have a template
-- Note: This requires a created_by user, so it's commented out
-- Uncomment and modify once you have a user in the system

-- INSERT INTO public.boards (
--     organization_id,
--     title,
--     problem_statement,
--     description,
--     is_public
-- ) VALUES (
--     'a0000000-0000-0000-0000-000000000001',
--     'Welcome to Edeastorm',
--     'How might we make brainstorming sessions more engaging and productive for remote teams?',
--     'This is a demo board to showcase the collaborative canvas features.',
--     true
-- );
