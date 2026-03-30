import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Calendar } from 'lucide-react';

export default function SessionsPage() {
  const { t } = useTranslation();

  const { data: sessions } = useQuery({
    queryKey: ['all-sessions-page'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false });
      return data || [];
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          {t('nav.sessions')}
        </h1>
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
    </DashboardLayout>
  );
}
