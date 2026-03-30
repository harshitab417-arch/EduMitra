-- Allow admins to update mentor profiles after creating mentor accounts.

DROP POLICY IF EXISTS "Mentors can update own" ON public.mentors;

CREATE POLICY "Mentors and admins can update mentors"
  ON public.mentors
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

