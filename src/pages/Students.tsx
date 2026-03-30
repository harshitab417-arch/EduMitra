import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { GraduationCap, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LogSessionDialog from '@/components/shared/LogSessionDialog';
import PageHeader from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createIsolatedAuthClient } from '@/lib/isolatedAuthClient';

export default function StudentsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logOpen, setLogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentSubjectsText, setStudentSubjectsText] = useState('');
  const [studentGrade, setStudentGrade] = useState(6);
  const [studentLevel, setStudentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [studentLocation, setStudentLocation] = useState('');
  const [studentStatus, setStudentStatus] = useState<'on_track' | 'at_risk' | 'flagged'>('on_track');

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
  const studentSubjects = useMemo(
    () => studentSubjectsText.split(',').map(s => s.trim()).filter(Boolean),
    [studentSubjectsText],
  );

  const { data: mentorSelf } = useQuery({
    queryKey: ['mentor-self', profile?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('mentors').select('id,expertise').eq('user_id', profile!.user_id).single();
      if (error) throw error;
      return data as { id: string; expertise: string[] };
    },
    enabled: profile?.role === 'mentor' && !!profile?.user_id,
  });

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

  const currentStatusValue = (studentId: string): 'on_track' | 'at_risk' | 'flagged' => {
    const label = derived.getStatus(studentId).label;
    if (label === 'Flagged') return 'flagged';
    if (label === 'At Risk') return 'at_risk';
    return 'on_track';
  };

  const dialogDefaults = useMemo(() => {
    if (!selectedStudentId) return { status: "completed" as const, score: 70 };
    return { studentIds: [selectedStudentId], status: "completed" as const, score: 70 };
  }, [selectedStudentId]);

  const canDeleteStudent = profile?.role === 'mentor' || profile?.role === 'admin';
  const canAddStudent = profile?.role === 'mentor' || profile?.role === 'admin';
  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { data, error } = await supabase.from('students').delete().eq('id', studentId).select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Not allowed to remove this student (RLS) or student not found.');
      }
    },
    onSuccess: async (_data, studentId) => {
      toast({ title: 'Student removed' });
      queryClient.setQueryData(['all-students-page'], (prev: any) => {
        if (!Array.isArray(prev)) return prev;
        return prev.filter((s: any) => s.id !== studentId);
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['all-students-page'] }),
        queryClient.invalidateQueries({ queryKey: ['all-students'] }),
        queryClient.invalidateQueries({ queryKey: ['matching-students'] }),
      ]);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message || 'Failed to remove student', variant: 'destructive' });
    },
  });

  const setStudentStatusMutation = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: 'on_track' | 'at_risk' | 'flagged' }) => {
      const student = (students || []).find((s: any) => s.id === studentId);
      const subject = student?.subjects?.[0] || 'General';

      if (status === 'on_track') {
        const { error } = await supabase
          .from('gap_alerts')
          .update({ resolved_at: new Date().toISOString() })
          .eq('student_id', studentId)
          .is('resolved_at', null);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from('gap_alerts').insert({
        student_id: studentId,
        subject,
        severity: status,
        message: status === 'flagged' ? 'Student manually flagged' : 'Student manually marked at risk',
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: 'Status updated' });
      await queryClient.invalidateQueries({ queryKey: ['student-milestones'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message || 'Failed to update status', variant: 'destructive' });
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: async () => {
      if (!studentName || !studentEmail || !studentPassword) {
        throw new Error('Name, email and password are required');
      }
      if (studentSubjects.length === 0) {
        throw new Error('Add at least one subject');
      }

      if (profile?.role === 'mentor') {
        const mentorSubjectSet = new Set((mentorSelf?.expertise || []).map((s) => s.toLowerCase()));
        const invalid = studentSubjects.filter((s) => !mentorSubjectSet.has(s.toLowerCase()));
        if (invalid.length > 0) {
          throw new Error(`Student subjects must be from your expertise. Invalid: ${invalid.join(', ')}`);
        }
      }

      const isolatedAuth = createIsolatedAuthClient();
      const { data: signUpData, error: signUpError } = await isolatedAuth.auth.signUp({
        email: studentEmail,
        password: studentPassword,
        options: { data: { name: studentName, role: 'student' } },
      });
      if (signUpError) throw signUpError;

      const newStudentUserId = signUpData.user?.id;
      if (!newStudentUserId) throw new Error('Student account was not created.');

      const { data: updatedStudent, error: updateError } = await supabase
        .from('students')
        .update({
          grade: studentGrade,
          subjects: studentSubjects,
          baseline_level: studentLevel,
          location: studentLocation,
        })
        .eq('user_id', newStudentUserId)
        .select('id')
        .single();
      if (updateError) throw updateError;

      if (studentStatus !== 'on_track') {
        const { error: alertError } = await supabase.from('gap_alerts').insert({
          student_id: updatedStudent.id,
          subject: studentSubjects[0] || 'General',
          severity: studentStatus,
          message:
            studentStatus === 'flagged'
              ? 'Student marked as flagged during mentor onboarding'
              : 'Student marked as at risk during mentor onboarding',
        });
        if (alertError) throw alertError;
      }
    },
    onSuccess: async () => {
      toast({ title: 'Student added', description: 'Student account and profile were created and synced.' });
      setStudentName('');
      setStudentEmail('');
      setStudentPassword('');
      setStudentSubjectsText('');
      setStudentGrade(6);
      setStudentLevel('beginner');
      setStudentLocation('');
      setStudentStatus('on_track');
      setShowAddStudentForm(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['all-students-page'] }),
        queryClient.invalidateQueries({ queryKey: ['all-students'] }),
        queryClient.invalidateQueries({ queryKey: ['matching-students'] }),
      ]);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message || 'Failed to add student', variant: 'destructive' });
    },
  });

  return (
    <DashboardLayout>
      <PageHeader
        title={t('nav.students')}
        subtitle="Manage learners, track status, and log sessions quickly."
        icon={<GraduationCap className="h-6 w-6 text-primary" />}
        actions={
          canAddStudent ? (
            <Button variant="outline" onClick={() => setShowAddStudentForm((v) => !v)}>
              {showAddStudentForm ? 'Hide Add Student' : 'Add Student Directly'}
            </Button>
          ) : null
        }
      />

      {showAddStudentForm && (
        <div className="stat-card mb-4">
          <h3 className="font-semibold mb-1">Add student directly</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Creates a student account and syncs grade, subjects, level, location, and status.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Student name</p>
              <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g., Rahul Kumar" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Student email</p>
              <Input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="student@email.com" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Temporary password</p>
              <Input type="password" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} placeholder="Minimum 6 characters" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Grade</p>
              <Input type="number" min={1} max={12} value={studentGrade} onChange={(e) => setStudentGrade(Number(e.target.value))} />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">
                Subjects {profile?.role === 'mentor' ? '(must be from your expertise)' : ''}
              </p>
              <Input
                value={studentSubjectsText}
                onChange={(e) => setStudentSubjectsText(e.target.value)}
                placeholder="e.g., Mathematics, Science"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Level</p>
              <Select value={studentLevel} onValueChange={(v: any) => setStudentLevel(v)}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">beginner</SelectItem>
                  <SelectItem value="intermediate">intermediate</SelectItem>
                  <SelectItem value="advanced">advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Select value={studentStatus} onValueChange={(v: any) => setStudentStatus(v)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_track">on_track</SelectItem>
                  <SelectItem value="at_risk">at_risk</SelectItem>
                  <SelectItem value="flagged">flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <Input value={studentLocation} onChange={(e) => setStudentLocation(e.target.value)} placeholder="e.g., Pune" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => addStudentMutation.mutate()} disabled={addStudentMutation.isPending}>
              {addStudentMutation.isPending ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </div>
      )}

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
                  <div className="flex items-center gap-2">
                    <Badge variant={derived.getStatus(s.id).variant}>{derived.getStatus(s.id).label}</Badge>
                    <Select
                      value={currentStatusValue(s.id)}
                      onValueChange={(v: any) => setStudentStatusMutation.mutate({ studentId: s.id, status: v })}
                      disabled={setStudentStatusMutation.isPending}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_track">on_track</SelectItem>
                        <SelectItem value="at_risk">at_risk</SelectItem>
                        <SelectItem value="flagged">flagged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  <div className="flex gap-2">
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
                    {canDeleteStudent && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const ok = window.confirm(`Remove student "${s.profiles?.name || 'Student'}"?`);
                          if (ok) removeStudentMutation.mutate(s.id);
                        }}
                        disabled={removeStudentMutation.isPending}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
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
