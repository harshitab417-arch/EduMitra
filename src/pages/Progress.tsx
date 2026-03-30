import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/shared/StatCard';
import { BarChart3, TrendingUp, BookOpen, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ProgressPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: student } = useQuery({
    queryKey: ['student-progress-page', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('students').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: progressData } = useQuery({
    queryKey: ['progress-data', student?.id],
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

  const subjectMap: Record<string, number[]> = {};
  progressData?.forEach(p => {
    if (!subjectMap[p.subject]) subjectMap[p.subject] = [];
    subjectMap[p.subject].push(p.score);
  });

  const subjectAvgs = Object.entries(subjectMap).map(([subject, scores]) => ({
    subject,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    latest: scores[scores.length - 1],
  }));

  const overallAvg = progressData?.length
    ? Math.round(progressData.reduce((s, p) => s + p.score, 0) / progressData.length)
    : 0;

  const chartData = progressData?.map(p => ({
    date: new Date(p.assessment_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    score: p.score,
  })) || [];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          {t('student.myProgress')}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Overall Average" value={`${overallAvg}%`} icon={TrendingUp} variant="primary" />
        <StatCard title="Subjects" value={Object.keys(subjectMap).length} icon={BookOpen} variant="secondary" />
        <StatCard title="Assessments" value={progressData?.length || 0} icon={Target} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Score Trend</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">{t('common.noData')}</p>
          )}
        </div>

        <div className="stat-card">
          <h3 className="font-semibold mb-4">Subject Performance</h3>
          {subjectAvgs.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={subjectAvgs}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="subject" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">{t('common.noData')}</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
