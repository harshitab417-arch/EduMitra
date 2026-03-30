-- Allow mentors/admins to update student learning details.
-- Existing policy only allows students to update their own row.

DROP POLICY IF EXISTS "Students can update own" ON public.students;
DROP POLICY IF EXISTS "Students can insert own" ON public.students;

CREATE POLICY "Students can update own"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'mentor')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Students can insert own"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'mentor')
    OR public.has_role(auth.uid(), 'admin')
  );

