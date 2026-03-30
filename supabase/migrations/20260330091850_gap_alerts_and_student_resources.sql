-- Gap alerts table: persists learning gap notifications per student
CREATE TABLE public.gap_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('on_track', 'at_risk', 'flagged')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.gap_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gap alerts visible to authenticated"
  ON public.gap_alerts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors and admins can insert gap alerts"
  ON public.gap_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

-- Student resources table: pins lesson plans or DB resources to a student
CREATE TABLE public.student_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  lesson_plan_id TEXT,
  pinned_by UUID REFERENCES auth.users(id) NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_resources_resource_or_lesson
    CHECK (resource_id IS NOT NULL OR lesson_plan_id IS NOT NULL)
);

ALTER TABLE public.student_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pins visible to authenticated"
  ON public.student_resources
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors and admins can pin resources"
  ON public.student_resources
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

