-- Learning topics catalog (grade-appropriate topics per subject).
-- This links optionally to the static lesson plans in src/lib/resourceMap.ts via lesson_plan_id.
CREATE TABLE public.learning_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  lesson_plan_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grade, subject, topic)
);

ALTER TABLE public.learning_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learning topics visible to authenticated"
  ON public.learning_topics
  FOR SELECT
  TO authenticated
  USING (true);

-- Mentors/admins can add topics during real usage (hackathon-friendly).
-- Admins remain the only ones who can edit/delete topics.
CREATE POLICY "Mentors and admins can insert learning topics"
  ON public.learning_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage learning topics"
  ON public.learning_topics
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Student milestones: per-student per-topic status and last activity.
CREATE TABLE public.student_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.learning_topics(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'flagged')),
  last_session_at TIMESTAMPTZ,
  last_score INTEGER CHECK (last_score >= 0 AND last_score <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, topic_id)
);

ALTER TABLE public.student_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones visible to authenticated"
  ON public.student_milestones
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors and admins can update milestones"
  ON public.student_milestones
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Mentors and admins can edit milestones"
  ON public.student_milestones
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'mentor') OR public.has_role(auth.uid(), 'admin'));

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_student_milestones_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_student_milestones_updated_at ON public.student_milestones;
CREATE TRIGGER update_student_milestones_updated_at
  BEFORE UPDATE ON public.student_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_student_milestones_updated_at();

