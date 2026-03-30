-- Allow mentor/admin delete operations for student and mentor management.

CREATE POLICY "Mentors and admins can delete students"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete mentors"
  ON public.mentors
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

