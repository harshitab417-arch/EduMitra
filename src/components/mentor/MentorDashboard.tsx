import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/shared/StatCard';
import { Users, Calendar, BookOpen, TrendingUp } from 'lucide-react';

export default function MentorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: mentor } = useQuery({
    queryKey: ['mentor', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('mentors').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: matches } = useQuery({
    queryKey: ['mentor-matches', mentor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select('*, students(*, profiles:students!inner(user_id))')
        .eq('mentor_id', mentor!.id)
        .eq('status', 'active');
      return data || [];
    },
    enabled: !!mentor,
  });

  const { data: sessions } = useQuery({
    queryKey: ['mentor-sessions', mentor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('mentor_id', mentor!.id)
        .order('date', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!mentor,
  });

  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const upcomingSessions = sessions?.filter(s => s.status === 'scheduled').length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('mentor.myStudents')} value={matches?.length || 0} icon={Users} variant="primary" />
        <StatCard title={t('dashboard.sessionsCompleted')} value={completedSessions} icon={Calendar} variant="success" />
        <StatCard title={t('dashboard.upcomingSessions')} value={upcomingSessions} icon={BookOpen} variant="warning" />
        <StatCard title="Expertise" value={mentor?.expertise?.length || 0} icon={TrendingUp} variant="secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="stat-card">
          <h3 className="font-semibold mb-4">{t('dashboard.recentSessions')}</h3>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{s.topic || 'Session'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">{t('common.noData')}</p>
          )}
        </div>

        {/* My Students */}
        <div className="stat-card">
          <h3 className="font-semibold mb-4">{t('mentor.myStudents')}</h3>
          {matches && matches.length > 0 ? (
            <div className="space-y-2">
              {matches.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    S
                  </div>
                  <div>
                    <p className="font-medium text-sm">Student</p>
                    <p className="text-xs text-muted-foreground">Match: {m.match_score}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">{t('common.noData')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
