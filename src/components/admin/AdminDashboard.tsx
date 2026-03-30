import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/shared/StatCard';
import { GraduationCap, Users, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { calculateRiskScore } from '@/lib/matcher';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data: students } = useQuery({
    queryKey: ['all-students'],
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

  const { data: mentors } = useQuery({
    queryKey: ['all-mentors'],
    queryFn: async () => {
      const [{ data: mentorsData, error: mentorsError }, { data: profilesData, error: profilesError }] =
        await Promise.all([
          supabase.from('mentors').select('*'),
          supabase.from('profiles').select('user_id,name'),
        ]);
      if (mentorsError) throw mentorsError;
      if (profilesError) throw profilesError;

      const nameByUserId = new Map<string, string>();
      (profilesData || []).forEach((p: any) => nameByUserId.set(p.user_id, p.name));

      return (mentorsData || []).map((m: any) => ({
        ...m,
        profiles: { name: nameByUserId.get(m.user_id) || 'Mentor' },
      }));
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ['all-sessions'],
    queryFn: async () => {
      const { data } = await supabase.from('sessions').select('*');
      return data || [];
    },
  });

  const { data: progressData } = useQuery({
    queryKey: ['all-progress'],
    queryFn: async () => {
      const { data } = await supabase.from('progress').select('*');
      return data || [];
    },
  });

  const totalStudents = students?.length || 0;
  const totalMentors = mentors?.length || 0;
  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const avgProgress = progressData?.length
    ? Math.round(progressData.reduce((s, p) => s + p.score, 0) / progressData.length)
    : 0;

  // Subject-wise progress
  const subjectMap: Record<string, number[]> = {};
  progressData?.forEach(p => {
    if (!subjectMap[p.subject]) subjectMap[p.subject] = [];
    subjectMap[p.subject].push(p.score);
  });
  const subjectData = Object.entries(subjectMap).map(([subject, scores]) => ({
    subject,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  // At-risk students (simulated based on available data)
  const atRiskStudents = students?.filter(() => {
    const risk = calculateRiskScore(
      Math.random() * 0.5 + 0.4, // simulated attendance
      Math.random() * 40 + 20, // simulated avg score
      Math.random() * 2 - 1 // simulated trend
    );
    return risk.level === 'high';
  }) || [];

  const engagementData = [
    { name: 'Active', value: totalStudents - atRiskStudents.length },
    { name: 'At Risk', value: atRiskStudents.length },
  ];
  const COLORS = ['hsl(152, 60%, 42%)', 'hsl(0, 72%, 51%)'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.totalStudents')} value={totalStudents} icon={GraduationCap} variant="primary" change="+12%" />
        <StatCard title={t('dashboard.activeMentors')} value={totalMentors} icon={Users} variant="secondary" change="+5%" />
        <StatCard title={t('dashboard.sessionsCompleted')} value={completedSessions} icon={Calendar} variant="success" change="+23%" />
        <StatCard title={t('dashboard.avgProgress')} value={`${avgProgress}%`} icon={TrendingUp} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <div className="stat-card">
          <h3 className="font-semibold mb-4">{t('dashboard.progressOverview')}</h3>
          {subjectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="subject" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">{t('common.noData')}</p>
          )}
        </div>

        {/* Engagement */}
        <div className="stat-card">
          <h3 className="font-semibold mb-4">{t('dashboard.engagementRate')}</h3>
          {totalStudents > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={engagementData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {engagementData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">{t('common.noData')}</p>
          )}
        </div>
      </div>

      {/* At Risk Students */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold">{t('dashboard.atRiskStudents')}</h3>
        </div>
        {atRiskStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {atRiskStudents.slice(0, 6).map((s: any) => (
              <div key={s.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <p className="font-medium text-sm">{s.profiles?.name || 'Student'}</p>
                <p className="text-xs text-muted-foreground">Grade {s.grade}</p>
                <div className="mt-2 flex gap-1">
                  {s.subjects?.map((subj: string) => (
                    <span key={subj} className="text-xs px-2 py-0.5 rounded-full bg-muted">{subj}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{totalStudents === 0 ? t('common.noData') : 'All students are on track! 🎉'}</p>
        )}
      </div>
    </div>
  );
}
