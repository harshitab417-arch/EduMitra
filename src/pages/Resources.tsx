import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { resourceMap, LessonPlan } from '@/lib/resourceMap';
import { FolderOpen, BookOpen, Clock, Target, Play, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LogSessionDialog from '@/components/shared/LogSessionDialog';
import PinResourceDialog from '@/components/shared/PinResourceDialog';
import PageHeader from '@/components/shared/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function ResourcesPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const { data: roleSubjects } = useQuery({
    queryKey: ['resources-role-subjects', user?.id, profile?.role],
    enabled: !!user && (profile?.role === 'student' || profile?.role === 'mentor'),
    queryFn: async () => {
      if (!user || !profile) return [] as string[];

      if (profile.role === 'student') {
        const { data, error } = await supabase.from('students').select('subjects').eq('user_id', user.id).single();
        if (error) throw error;
        return (data?.subjects || []) as string[];
      }

      if (profile.role === 'mentor') {
        const { data, error } = await supabase.from('mentors').select('expertise').eq('user_id', user.id).single();
        if (error) throw error;
        return (data?.expertise || []) as string[];
      }

      return [] as string[];
    },
  });

  const normalizedAllowedSubjects = useMemo(
    () => new Set((roleSubjects || []).map((s) => s.toLowerCase().trim()).filter(Boolean)),
    [roleSubjects],
  );

  const visibleResources = useMemo(() => {
    if (profile?.role === 'student' || profile?.role === 'mentor') {
      if (normalizedAllowedSubjects.size === 0) return [] as LessonPlan[];
      return resourceMap.filter((r) => normalizedAllowedSubjects.has(r.subject.toLowerCase().trim()));
    }
    return resourceMap;
  }, [profile?.role, normalizedAllowedSubjects]);

  const subjects = useMemo(
    () => ['all', ...new Set(visibleResources.map(r => r.subject))],
    [visibleResources],
  );

  useEffect(() => {
    if (selectedSubject !== 'all' && !subjects.includes(selectedSubject)) {
      setSelectedSubject('all');
      setSelectedLesson(null);
    }
  }, [selectedSubject, subjects]);

  const filtered = selectedSubject === 'all'
    ? visibleResources
    : visibleResources.filter(r => r.subject === selectedSubject);

  const sessionDefaults = useMemo(() => {
    if (!selectedLesson) return undefined;
    return {
      subject: selectedLesson.subject,
      topic: selectedLesson.topic,
      lessonPlanId: selectedLesson.id,
      status: "completed" as const,
      score: 70,
      notes: `Lesson plan: ${selectedLesson.topic} (${selectedLesson.duration})`,
    };
  }, [selectedLesson]);

  return (
    <DashboardLayout>
      <PageHeader
        title={t('nav.resources')}
        subtitle="Pick a structured plan, start a session, and pin follow-ups."
        icon={<FolderOpen className="h-6 w-6 text-primary" />}
      />

      {/* Subject filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {subjects.map(s => (
          <button
            key={s}
            onClick={() => { setSelectedSubject(s); setSelectedLesson(null); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedSubject === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {selectedLesson ? (
        <div className="stat-card animate-fade-in">
          <button onClick={() => setSelectedLesson(null)} className="text-sm text-primary mb-4 hover:underline">
            ← Back to resources
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">{selectedLesson.topic}</h2>
              <div className="flex gap-3 mb-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {selectedLesson.subject}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selectedLesson.duration}</span>
                <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Grade {selectedLesson.grade}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  selectedLesson.difficulty === 'beginner' ? 'bg-success/10 text-success' :
                  selectedLesson.difficulty === 'intermediate' ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'
                }`}>{selectedLesson.difficulty}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setLogOpen(true)} className="gap-2">
                <Play className="h-4 w-4" /> Start Session
              </Button>
              <Button variant="outline" onClick={() => setPinOpen(true)} className="gap-2">
                <Pin className="h-4 w-4" /> Pin to Student
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">🎯 Objectives</h3>
              <ul className="space-y-1">
                {selectedLesson.objectives.map((o, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> {o}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🎮 Activities</h3>
              <ul className="space-y-1">
                {selectedLesson.activities.map((a, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-secondary mt-0.5">•</span> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📝 Practice Questions</h3>
              <ol className="space-y-2">
                {selectedLesson.practiceQuestions.map((q, i) => (
                  <li key={i} className="text-sm p-3 rounded-lg bg-muted/50">
                    <span className="font-medium text-primary mr-2">Q{i + 1}.</span> {q}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <LogSessionDialog open={logOpen} onOpenChange={setLogOpen} defaults={sessionDefaults} />
          <PinResourceDialog
            open={pinOpen}
            onOpenChange={setPinOpen}
            lessonPlanId={selectedLesson.id}
            lessonTitle={selectedLesson.topic}
          />
        </div>
      ) : (
        filtered.length === 0 ? (
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">
              {profile?.role === 'student'
                ? 'No resources available. Add subjects in Student setup to unlock relevant topics.'
                : profile?.role === 'mentor'
                  ? 'No resources available. Add expertise in Mentor setup to unlock relevant topics.'
                  : t('common.noData')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedLesson(r)}
                className="stat-card text-left hover:border-primary/30 transition-all group"
              >
                <h3 className="font-semibold group-hover:text-primary transition-colors">{r.topic}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.subject} · Grade {r.grade}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.duration}</span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    r.difficulty === 'beginner' ? 'bg-success/10 text-success' :
                    r.difficulty === 'intermediate' ? 'bg-warning/10 text-warning' :
                    'bg-destructive/10 text-destructive'
                  }`}>{r.difficulty}</span>
                </div>
              </button>
            ))}
          </div>
        )
      )}
    </DashboardLayout>
  );
}
