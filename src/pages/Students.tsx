import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { GraduationCap, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import LogSessionDialog from '@/components/shared/LogSessionDialog';

export default function StudentsPage() {
  const { t } = useTranslation();
  const [logOpen, setLogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { data: students } = useQuery({
    queryKey: ['all-students-page'],
    queryFn: async () => {
      const [{ data: studentsData, error: studentsError }, { data: profilesData, error: profilesError }] =
        await Promise.all([
          supabase.from('students').select('*'),
          supabase.from('profiles').select('user_id,name'),
        ]);
      if (studentsError) throw studentsError;
      if (profilesError) throw profilesError;

      const nameByUserId = new Map<string, string>();
      (profilesData || []).forEach((p: any) => nameByUserId.set(p.user_id, p.name));

      return (studentsData || []).map((s: any) => ({
        ...s,
        profiles: { name: nameByUserId.get(s.user_id) || 'Student' },
      }));
    },
  });

  const studentIds = useMemo(() => (students || []).map((s: any) => s.id), [students]);

  const { data: milestones } = useQuery({
    queryKey: ['student-milestones', studentIds],
    queryFn: async () => {
      if (!studentIds.length) return [];
      const { data, error } = await supabase
        .from('student_milestones')
        .select('student_id,status,last_session_at,last_score')
        .in('student_id', studentIds);
      if (error) throw error;
      return data || [];
    },
    enabled: studentIds.length > 0,
  });

  const { data: sessions } = useQuery({
    queryKey: ['student-latest-sessions', studentIds],
    queryFn: async () => {
      if (!studentIds.length) return [];
      const { data, error } = await supabase
        .from('sessions')
        .select('student_id,date,status')
        .in('student_id', studentIds)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: studentIds.length > 0,
  });

  const derived = useMemo(() => {
    const msByStudent = new Map<string, any[]>();
    (milestones || []).forEach((m: any) => {
      const arr = msByStudent.get(m.student_id) || [];
      arr.push(m);
      msByStudent.set(m.student_id, arr);
    });

    const latestSessionByStudent = new Map<string, any>();
    (sessions || []).forEach((s: any) => {
      if (!latestSessionByStudent.has(s.student_id)) latestSessionByStudent.set(s.student_id, s);
    });

    const getStatus = (studentId: string) => {
      const ms = msByStudent.get(studentId) || [];
      if (ms.some((x) => x.status === 'flagged')) return { label: 'Flagged', variant: 'destructive' as const };
      // Simple at-risk heuristic: no session in 14 days OR any in_progress with very low score
      const latest = latestSessionByStudent.get(studentId);
      if (!latest) return { label: 'At Risk', variant: 'secondary' as const };
      const days = (Date.now() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24);
      if (days >= 14) return { label: 'At Risk', variant: 'secondary' as const };
      return { label: 'On Track', variant: 'outline' as const };
    };

    const getProgress = (studentId: string) => {
      const ms = msByStudent.get(studentId) || [];
      const total = Math.max(ms.length, 0);
      const completed = ms.filter((x) => x.status === 'completed').length;
      const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { total, completed, pct };
    };

    const getLastSessionDate = (studentId: string) => {
      const latest = latestSessionByStudent.get(studentId);
      return latest?.date ? new Date(latest.date).toLocaleDateString('en-IN') : null;
    };

    return { getStatus, getProgress, getLastSessionDate };
  }, [milestones, sessions]);

  const dialogDefaults = useMemo(() => {
    if (!selectedStudentId) return { status: "completed" as const, score: 70 };
    return { studentId: selectedStudentId, status: "completed" as const, score: 70 };
  }, [selectedStudentId]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          {t('nav.students')}
        </h1>
      </div>

      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('auth.name')}</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progress</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Session</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('common.grade')}</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('student.subjects')}</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Level</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {students?.map((s: any) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-medium">{s.profiles?.name || '-'}</td>
                <td className="py-3 px-4">
                  <Badge variant={derived.getStatus(s.id).variant}>{derived.getStatus(s.id).label}</Badge>
                </td>
                <td className="py-3 px-4 min-w-[220px]">
                  <div className="space-y-1">
                    <Progress value={derived.getProgress(s.id).pct} />
                    <p className="text-xs text-muted-foreground">
                      {derived.getProgress(s.id).completed}/{derived.getProgress(s.id).total || 0} topics completed
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {derived.getLastSessionDate(s.id) ?? "—"}
                </td>
                <td className="py-3 px-4">{s.grade}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {s.subjects?.map((sub: string) => (
                      <span key={sub} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{sub}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 capitalize">{s.baseline_level}</td>
                <td className="py-3 px-4">{s.location || '-'}</td>
                <td className="py-3 px-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setLogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Log Session
                  </Button>
                </td>
              </tr>
            ))}
            {(!students || students.length === 0) && (
              <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <LogSessionDialog open={logOpen} onOpenChange={setLogOpen} defaults={dialogDefaults} />
    </DashboardLayout>
  );
}
