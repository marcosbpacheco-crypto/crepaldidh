-- =============================================
-- Migration 008: RLS individual para as tabelas da Central de Conhecimento
-- (conforme padrão já usado nas outras tabelas do schema)
-- =============================================

-- 1. knowledge_tools
ALTER TABLE public.knowledge_tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS knowledge_tools_all ON public.knowledge_tools;
CREATE POLICY knowledge_tools_select ON public.knowledge_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY knowledge_tools_insert ON public.knowledge_tools FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY knowledge_tools_update ON public.knowledge_tools FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY knowledge_tools_delete ON public.knowledge_tools FOR DELETE TO authenticated USING (true);

-- 2. knowledge_dynamics
ALTER TABLE public.knowledge_dynamics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS knowledge_dynamics_all ON public.knowledge_dynamics;
CREATE POLICY knowledge_dynamics_select ON public.knowledge_dynamics FOR SELECT TO authenticated USING (true);
CREATE POLICY knowledge_dynamics_insert ON public.knowledge_dynamics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY knowledge_dynamics_update ON public.knowledge_dynamics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY knowledge_dynamics_delete ON public.knowledge_dynamics FOR DELETE TO authenticated USING (true);

-- 3. knowledge_usage
ALTER TABLE public.knowledge_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS knowledge_usage_all ON public.knowledge_usage;
CREATE POLICY knowledge_usage_select ON public.knowledge_usage FOR SELECT TO authenticated USING (true);
CREATE POLICY knowledge_usage_insert ON public.knowledge_usage FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY knowledge_usage_update ON public.knowledge_usage FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY knowledge_usage_delete ON public.knowledge_usage FOR DELETE TO authenticated USING (true);

-- 4. knowledge_links
ALTER TABLE public.knowledge_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS knowledge_links_all ON public.knowledge_links;
CREATE POLICY knowledge_links_select ON public.knowledge_links FOR SELECT TO authenticated USING (true);
CREATE POLICY knowledge_links_insert ON public.knowledge_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY knowledge_links_update ON public.knowledge_links FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY knowledge_links_delete ON public.knowledge_links FOR DELETE TO authenticated USING (true);

-- 5. knowledge_favorites
ALTER TABLE public.knowledge_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS knowledge_favorites_all ON public.knowledge_favorites;
CREATE POLICY knowledge_favorites_select ON public.knowledge_favorites FOR SELECT TO authenticated USING (true);
CREATE POLICY knowledge_favorites_insert ON public.knowledge_favorites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY knowledge_favorites_update ON public.knowledge_favorites FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY knowledge_favorites_delete ON public.knowledge_favorites FOR DELETE TO authenticated USING (true);
