-- Allow mentors/admins to resolve (update) gap alerts.

CREATE POLICY "Mentors and admins can update gap alerts"
  ON public.gap_alerts
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

