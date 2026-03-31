import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LogSessionDialog from '@/components/shared/LogSessionDialog';
import PageHeader from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';

export default function SessionsPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [logOpen, setLogOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState<string>('');
  const [topicFilter, setTopicFilter] = useState<string>('');

  const { data: myStudent } = useQuery({
    queryKey: ['sessions-my-student', user?.id],
    enabled: !!user && profile?.role === 'student',
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('id,subjects').eq('user_id', user!.id).single();
      if (error) throw error;
      return data as { id: string; subjects: string[] };
    },
  });

  const { data: peerStudentIds } = useQuery({
    queryKey: ['sessions-peer-student-ids', myStudent?.id, myStudent?.subjects],
    enabled: profile?.role === 'student' && !!myStudent,
    queryFn: async () => {
      const mySubjects = (myStudent?.subjects || []).map((s) => s.toLowerCase());
      if (!mySubjects.length) return [myStudent!.id];

      const { data, error } = await supabase.from('students').select('id,subjects');
      if (error) throw error;

      const peers = (data || [])
        .filter((s: any) => {
          const subjects = (s.subjects || []).map((sub: string) => sub.toLowerCase());
          return subjects.some((sub: string) => mySubjects.includes(sub));
        })
        .map((s: any) => s.id);

      if (!peers.includes(myStudent!.id)) peers.push(myStudent!.id);
      return peers;
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ['all-sessions-page', studentFilter, topicFilter, profile?.role, peerStudentIds],
    queryFn: async () => {
      let q = supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false });

      if (profile?.role === 'student') {
        const ids = peerStudentIds || [];
        if (ids.length === 0) return [];
        q = q.in('student_id', ids);
      }

      if (studentFilter.trim()) q = q.eq('student_id', studentFilter.trim());
      if (topicFilter.trim()) q = q.ilike('topic', `%${topicFilter.trim()}%`);

      const { data } = await q;
      const sessionsList = data || [];

      const studentIds = Array.from(new Set(sessionsList.map((s: any) => s.student_id)));
      if (!studentIds.length) {
        return sessionsList.map((s: any) => ({ ...s, studentName: null, studentGrade: null }));
      }

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id,user_id,grade')
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
          studentName: nameByUserId.get(st.user_id) || 'Student',
          studentGrade: st.grade ?? null,
        }),
      );

      return sessionsList.map((s: any) => ({
        ...s,
        studentName: studentsById.get(s.student_id)?.studentName ?? null,
        studentGrade: studentsById.get(s.student_id)?.studentGrade ?? null,
      }));
    },
    enabled: profile?.role !== 'student' || !!myStudent,
  });

  const defaults = useMemo(() => ({ status: "completed" as const, score: 70 }), []);

  return (
    <DashboardLayout>
      <PageHeader
        title={t('nav.sessions')}
        subtitle="Log sessions fast and review history with context."
        icon={<Calendar className="h-6 w-6 text-primary" />}
        actions={
          <Button onClick={() => setLogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Log New Session
          </Button>
        }
      />

      <div className="stat-card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profile?.role !== 'student' && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Filter by student_id</p>
              <Input value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} placeholder="Paste a student UUID" />
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Filter by topic</p>
            <Input value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} placeholder="e.g., Fractions" />
          </div>
        </div>
      </div>

      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('common.date')}</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Topic</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('common.status')}</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sessions?.map((s) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">{new Date(s.date).toLocaleDateString('en-IN')}</td>
                <td className="py-3 px-4">
                  <div className="text-sm font-medium">{s.studentName || 'Student'}</div>
                  {s.studentGrade !== null && s.studentGrade !== undefined && (
                    <div className="text-xs text-muted-foreground">Grade {s.studentGrade}</div>
                  )}
                </td>
                <td className="py-3 px-4 font-medium">{s.topic || '-'}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">{s.notes || '-'}</td>
              </tr>
            ))}
            {(!sessions || sessions.length === 0) && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <LogSessionDialog open={logOpen} onOpenChange={setLogOpen} defaults={defaults} />
    </DashboardLayout>
  );
}
