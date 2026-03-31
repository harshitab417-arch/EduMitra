-- Allow students to log peer-discussion sessions and progress entries.
-- Existing mentor/admin policies remain in place.

CREATE POLICY "Students can insert sessions"
  ON public.sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students can insert progress"
  ON public.progress
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'student'));

