import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LogSessionDialog from '@/components/shared/LogSessionDialog';

export default function SessionsPage() {
  const { t } = useTranslation();
  const [logOpen, setLogOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState<string>('');
  const [topicFilter, setTopicFilter] = useState<string>('');

  const { data: sessions } = useQuery({
    queryKey: ['all-sessions-page', studentFilter, topicFilter],
    queryFn: async () => {
      let q = supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false });

      if (studentFilter.trim()) q = q.eq('student_id', studentFilter.trim());
      if (topicFilter.trim()) q = q.ilike('topic', `%${topicFilter.trim()}%`);

      const { data } = await q;
      return data || [];
    },
  });

  const defaults = useMemo(() => ({ status: "completed" as const, score: 70 }), []);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          {t('nav.sessions')}
        </h1>
        <Button onClick={() => setLogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Log New Session
        </Button>
      </div>

      <div className="stat-card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Filter by student_id</p>
            <Input value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} placeholder="Paste a student UUID" />
          </div>
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
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Topic</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('common.status')}</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sessions?.map((s) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">{new Date(s.date).toLocaleDateString('en-IN')}</td>
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
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <LogSessionDialog open={logOpen} onOpenChange={setLogOpen} defaults={defaults} />
    </DashboardLayout>
  );
}
