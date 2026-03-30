import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import { BarChart3, GraduationCap, Users, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

export default function ImpactPage() {
  const { t } = useTranslation();

  const { data: students } = useQuery({
    queryKey: ['impact-students'],
    queryFn: async () => {
      const { data } = await supabase.from('students').select('*');
      return data || [];
    },
  });

  const { data: mentors } = useQuery({
    queryKey: ['impact-mentors'],
    queryFn: async () => {
      const { data } = await supabase.from('mentors').select('*');
      return data || [];
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ['impact-sessions'],
    queryFn: async () => {
      const { data } = await supabase.from('sessions').select('*').order('date', { ascending: true });
      return data || [];
    },
  });

  const { data: progress } = useQuery({
    queryKey: ['impact-progress'],
    queryFn: async () => {
      const { data } = await supabase.from('progress').select('*').order('assessment_date', { ascending: true });
      return data || [];
    },
  });

  const totalStudents = students?.length || 0;
  const totalMentors = mentors?.length || 0;
  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const avgScore = progress?.length
    ? Math.round(progress.reduce((s, p) => s + p.score, 0) / progress.length)
    : 0;

  // Monthly session trend
  const monthMap: Record<string, number> = {};
  sessions?.forEach(s => {
    const month = new Date(s.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    monthMap[month] = (monthMap[month] || 0) + 1;
  });
  const sessionTrend = Object.entries(monthMap).map(([month, count]) => ({ month, sessions: count }));

  // Grade distribution
  const gradeMap: Record<number, number> = {};
  students?.forEach(s => {
    gradeMap[s.grade] = (gradeMap[s.grade] || 0) + 1;
  });
  const gradeData = Object.entries(gradeMap).map(([grade, count]) => ({ grade: `Grade ${grade}`, count }));

  // Progress trend
  const progressTrend = progress?.map(p => ({
    date: new Date(p.assessment_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    score: p.score,
  })) || [];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          {t('nav.impact')} Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Comprehensive NGO impact metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={t('dashboard.totalStudents')} value={totalStudents} icon={GraduationCap} variant="primary" />
        <StatCard title={t('dashboard.activeMentors')} value={totalMentors} icon={Users} variant="secondary" />
        <StatCard title={t('dashboard.sessionsCompleted')} value={completedSessions} icon={Calendar} variant="success" />
        <StatCard title={t('dashboard.avgProgress')} value={`${avgScore}%`} icon={TrendingUp} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Session Activity Trend</h3>
          {sessionTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={sessionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Area type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">{t('common.noData')}</p>
          )}
        </div>

        <div className="stat-card">
          <h3 className="font-semibold mb-4">Grade Distribution</h3>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="grade" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">{t('common.noData')}</p>
          )}
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold mb-4">Overall Progress Trend</h3>
        {progressTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={progressTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--success))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-12">{t('common.noData')}</p>
        )}
      </div>
    </DashboardLayout>
  );
}
