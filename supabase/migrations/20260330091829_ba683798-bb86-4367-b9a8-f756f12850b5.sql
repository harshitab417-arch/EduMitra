
-- Tighten INSERT/UPDATE policies to use role checks

-- Sessions: only mentors and admins can create/update
DROP POLICY "Authenticated can insert sessions" ON public.sessions;
DROP POLICY "Authenticated can update sessions" ON public.sessions;
CREATE POLICY "Mentors and admins can insert sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Mentors and admins can update sessions" ON public.sessions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

-- Progress: mentors and admins can insert
DROP POLICY "Authenticated can insert progress" ON public.progress;
CREATE POLICY "Mentors and admins can insert progress" ON public.progress FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

-- Resources: only admins can insert
DROP POLICY "Admins can insert resources" ON public.resources;
CREATE POLICY "Only admins can insert resources" ON public.resources FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Matches: only admins can insert/update
DROP POLICY "Authenticated can insert matches" ON public.matches;
DROP POLICY "Authenticated can update matches" ON public.matches;
CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
