import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/shared/StatCard';
import { Users, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function MentorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mentor } = useQuery({
    queryKey: ['mentor', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('mentors').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const [expertiseText, setExpertiseText] = useState('');
  const [availabilityText, setAvailabilityText] = useState('');

  const parsedExpertise = useMemo(
    () => expertiseText.split(',').map(s => s.trim()).filter(Boolean),
    [expertiseText],
  );
  const parsedAvailability = useMemo(
    () => availabilityText.split(',').map(s => s.trim()).filter(Boolean),
    [availabilityText],
  );

  const saveMentorMutation = useMutation({
    mutationFn: async () => {
      if (!mentor?.id) throw new Error('Mentor profile not found');
      const { error } = await supabase
        .from('mentors')
        .update({
          expertise: parsedExpertise,
          availability: parsedAvailability,
        })
        .eq('id', mentor.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: 'Saved', description: 'Mentor availability and expertise updated.' });
      await queryClient.invalidateQueries({ queryKey: ['mentor', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['matching-mentors'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message ?? 'Failed to update mentor', variant: 'destructive' });
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: 'Student removed', description: 'Student has been removed successfully.' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mentor-matches', mentor?.id] }),
        queryClient.invalidateQueries({ queryKey: ['all-students-page'] }),
        queryClient.invalidateQueries({ queryKey: ['all-students'] }),
        queryClient.invalidateQueries({ queryKey: ['matching-students'] }),
      ]);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message || 'Failed to remove student', variant: 'destructive' });
    },
  });

  // Pre-fill inputs once we have mentor data (only if user hasn't typed yet)
  useEffect(() => {
    if (!mentor) return;
    setExpertiseText((prev) => (prev ? prev : (mentor.expertise || []).join(', ')));
    setAvailabilityText((prev) => (prev ? prev : (mentor.availability || []).join(', ')));
  }, [mentor]);

  const { data: matches } = useQuery({
    queryKey: ['mentor-matches', mentor?.id],
    queryFn: async () => {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('mentor_id', mentor!.id)
        .eq('status', 'active');
      if (matchesError) throw matchesError;

      const studentIds = (matchesData || []).map((m: any) => m.student_id);
      if (!studentIds.length) return [];

      const [{ data: studentsData, error: studentsError }, { data: profilesData, error: profilesError }] =
        await Promise.all([
          supabase.from('students').select('id,user_id,subjects').in('id', studentIds),
          supabase.from('profiles').select('user_id,name'),
        ]);
      if (studentsError) throw studentsError;
      if (profilesError) throw profilesError;

      const nameByUserId = new Map<string, string>();
      (profilesData || []).forEach((p: any) => nameByUserId.set(p.user_id, p.name));

      const studentsById = new Map<string, any>();
      (studentsData || []).forEach((s: any) =>
        studentsById.set(s.id, {
          ...s,
          name: nameByUserId.get(s.user_id) || 'Student',
        }),
      );

      return (matchesData || []).map((m: any) => ({
        ...m,
        student: studentsById.get(m.student_id),
      }));
    },
    enabled: !!mentor,
  });

  const { data: myStudents } = useQuery({
    queryKey: ['mentor-students-by-subject', mentor?.id, mentor?.expertise],
    queryFn: async () => {
      const mentorSubjects = (mentor?.expertise || []).map((s: string) => s.toLowerCase());
      if (!mentorSubjects.length) return [];

      const [{ data: studentsData, error: studentsError }, { data: profilesData, error: profilesError }] =
        await Promise.all([
          supabase.from('students').select('id,user_id,grade,subjects'),
          supabase.from('profiles').select('user_id,name'),
        ]);
      if (studentsError) throw studentsError;
      if (profilesError) throw profilesError;

      const nameByUserId = new Map<string, string>();
      (profilesData || []).forEach((p: any) => nameByUserId.set(p.user_id, p.name));

      const activeMatchesByStudentId = new Map<string, any>();
      (matches || []).forEach((m: any) => activeMatchesByStudentId.set(m.student_id, m));

      return (studentsData || [])
        .filter((s: any) => {
          const studentSubjects = (s.subjects || []).map((sub: string) => sub.toLowerCase());
          return studentSubjects.some((sub: string) => mentorSubjects.includes(sub));
        })
        .map((s: any) => {
          const m = activeMatchesByStudentId.get(s.id);
          return {
            id: s.id,
            name: nameByUserId.get(s.user_id) || 'Student',
            subjects: s.subjects || [],
            grade: s.grade,
            match_score: m?.match_score ?? null,
          };
        });
    },
    enabled: !!mentor,
  });

  const { data: sessions } = useQuery({
    queryKey: ['mentor-sessions', mentor?.id],
    queryFn: async () => {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('mentor_id', mentor!.id)
        .order('date', { ascending: false })
        .limit(10);
      if (sessionsError) throw sessionsError;

      const sessionsList = sessionsData || [];
      const studentIds = Array.from(new Set(sessionsList.map((s: any) => s.student_id)));
      if (!studentIds.length) return sessionsList;

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id,user_id,grade,subjects')
        .in('id', studentIds);
      if (studentsError) throw studentsError;

      const userIds = Array.from(new Set((studentsData || []).map((s: any) => s.user_id)));
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id,name')
        .in('user_id', userIds);
      if (profilesError) throw profilesError;

      const nameByUserId = new Map<string, string>();
      (profilesData || []).forEach((p: any) => nameByUserId.set(p.user_id, p.name));

      const studentsById = new Map<string, any>();
      (studentsData || []).forEach((st: any) =>
        studentsById.set(st.id, {
          id: st.id,
          name: nameByUserId.get(st.user_id) || 'Student',
          grade: st.grade,
          subjects: st.subjects || [],
        }),
      );

      return sessionsList.map((s: any) => ({
        ...s,
        student: studentsById.get(s.student_id) || null,
      }));
    },
    enabled: !!mentor,
  });

  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const upcomingSessions = sessions?.filter(s => s.status === 'scheduled').length || 0;
  const recentSession = (sessions || []).slice(0, 1)[0];

  return (
    <div className="space-y-6">
      <div className="stat-card border border-border/60">
        <h3 className="font-semibold mb-1">Mentor setup (for matching)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Fill these so the auto-matching and “My Students” assignment becomes meaningful.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Expertise (comma-separated)</p>
            <Input
              value={expertiseText}
              onChange={(e) => setExpertiseText(e.target.value)}
              placeholder="e.g., Mathematics, Science, English"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Availability (comma-separated)</p>
            <Input
              value={availabilityText}
              onChange={(e) => setAvailabilityText(e.target.value)}
              placeholder="e.g., Mon 5pm, Wed 6pm, Sat 10am"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => saveMentorMutation.mutate()}
            disabled={saveMentorMutation.isPending || !mentor}
          >
            {saveMentorMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Snapshot</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('mentor.myStudents')} value={myStudents?.length || 0} icon={Users} variant="primary" />
        <StatCard title={t('dashboard.sessionsCompleted')} value={completedSessions} icon={Calendar} variant="success" />
        <StatCard title={t('dashboard.upcomingSessions')} value={upcomingSessions} icon={BookOpen} variant="warning" />
        <StatCard title="Expertise" value={mentor?.expertise?.length || 0} icon={TrendingUp} variant="secondary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="stat-card border border-border/60">
          <h3 className="font-semibold mb-4">{t('dashboard.recentSessions')}</h3>
          {recentSession ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{recentSession.topic || 'Session'}</p>
                  <p className="text-xs text-muted-foreground">
                    {recentSession.student?.name || 'Student'} · {new Date(recentSession.date).toLocaleDateString('en-IN')}
                  </p>
                  {recentSession.student?.grade !== undefined && recentSession.student?.grade !== null && (
                    <p className="text-xs text-muted-foreground">Grade {recentSession.student.grade}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  recentSession.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {recentSession.status}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">{t('common.noData')}</p>
          )}
        </div>

        {/* My Students */}
        <div className="stat-card border border-border/60">
          <h3 className="font-semibold mb-4">{t('mentor.myStudents')}</h3>
          {myStudents && myStudents.length > 0 ? (
            <div className="space-y-2">
              {myStudents.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {s.name?.[0] || 'S'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{s.name || 'Student'}</p>
                    <p className="text-xs text-muted-foreground">
                      Grade {s.grade} · {s.match_score !== null ? `Match: ${s.match_score}%` : 'Not matched yet'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (!s?.id) return;
                      const ok = window.confirm(`Remove student "${s.name || 'Student'}"?`);
                      if (ok) removeStudentMutation.mutate(s.id);
                    }}
                    disabled={removeStudentMutation.isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">No students found for your expertise yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
