import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/shared/StatCard';
import { BookOpen, Calendar, TrendingUp, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: student } = useQuery({
    queryKey: ['student', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('students').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: progressData } = useQuery({
    queryKey: ['progress', student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('progress')
        .select('*')
        .eq('student_id', student!.id)
        .order('assessment_date', { ascending: true });
      return data || [];
    },
    enabled: !!student,
  });

  const { data: sessions } = useQuery({
    queryKey: ['student-sessions', student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('student_id', student!.id)
        .order('date', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!student,
  });

  const { data: match } = useQuery({
    queryKey: ['student-match', student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select('*, mentors(*, profiles(name))')
        .eq('student_id', student!.id)
        .eq('status', 'active')
        .single();
      return data;
    },
    enabled: !!student,
  });

  const avgScore = progressData?.length
    ? Math.round(progressData.reduce((s, p) => s + p.score, 0) / progressData.length)
    : 0;

  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;

  const chartData = progressData?.map(p => ({
    date: new Date(p.assessment_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    score: p.score,
    subject: p.subject,
  })) || [];

  const [grade, setGrade] = useState<number>(6);
  const [subjectsText, setSubjectsText] = useState<string>('');
  const [baselineLevel, setBaselineLevel] = useState<string>('beginner');
  const [location, setLocation] = useState<string>('');

  const subjects = useMemo(
    () => subjectsText.split(',').map(s => s.trim()).filter(Boolean),
    [subjectsText],
  );

  useEffect(() => {
    if (!student) return;
    setGrade(student.grade ?? 6);
    setSubjectsText((student.subjects || []).join(', '));
    setBaselineLevel(student.baseline_level ?? 'beginner');
    setLocation(student.location ?? '');
  }, [student]);

  const saveStudentMutation = useMutation({
    mutationFn: async () => {
      if (!student?.id) throw new Error('Student profile not found');
      const { error } = await supabase
        .from('students')
        .update({
          grade,
          subjects,
          baseline_level: baselineLevel,
          location,
        })
        .eq('id', student.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: 'Saved', description: 'Student learning profile updated.' });
      await queryClient.invalidateQueries({ queryKey: ['student', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['matching-students'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message ?? 'Failed to update student', variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="stat-card">
        <h3 className="font-semibold mb-1">Student setup (for matching + milestones)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Fill these so mentors get matched correctly and progress tracking is accurate.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Grade</p>
            <Input
              type="number"
              min={1}
              max={12}
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Baseline level</p>
            <Select value={baselineLevel} onValueChange={setBaselineLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">beginner</SelectItem>
                <SelectItem value="intermediate">intermediate</SelectItem>
                <SelectItem value="advanced">advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Subjects (comma-separated)</p>
            <Input
              value={subjectsText}
              onChange={(e) => setSubjectsText(e.target.value)}
              placeholder="e.g., Mathematics, English, Science"
            />
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Location (optional)</p>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Pune"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => saveStudentMutation.mutate()}
            disabled={saveStudentMutation.isPending || !student}
          >
            {saveStudentMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('student.subjects')} value={student?.subjects?.length || 0} icon={BookOpen} variant="primary" />
        <StatCard title={t('student.scores')} value={`${avgScore}%`} icon={TrendingUp} variant="success" />
        <StatCard title={t('dashboard.sessionsCompleted')} value={completedSessions} icon={Calendar} variant="secondary" />
        <StatCard title={t('common.grade')} value={`Grade ${student?.grade || '-'}`} icon={Target} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <div className="lg:col-span-2 stat-card">
          <h3 className="font-semibold mb-4">{t('dashboard.progressOverview')}</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm py-12 text-center">{t('common.noData')}</p>
          )}
        </div>

        {/* Mentor Info */}
        <div className="stat-card">
          <h3 className="font-semibold mb-4">{t('student.myMentor')}</h3>
          {match ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {(match as any).mentors?.profiles?.name?.[0] || 'M'}
                </div>
                <div>
                  <p className="font-medium">{(match as any).mentors?.profiles?.name || 'Mentor'}</p>
                  <p className="text-xs text-muted-foreground">Match score: {match.match_score}%</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
          )}

          <h3 className="font-semibold mt-6 mb-3">{t('dashboard.recentSessions')}</h3>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                  <span className="font-medium">{s.topic || 'Session'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
