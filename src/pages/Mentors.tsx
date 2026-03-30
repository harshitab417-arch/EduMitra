import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Users } from 'lucide-react';

export default function MentorsPage() {
  const { t } = useTranslation();

  const { data: mentors } = useQuery({
    queryKey: ['all-mentors-page'],
    queryFn: async () => {
      const { data } = await supabase.from('mentors').select('*, profiles!inner(name)');
      return data || [];
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          {t('nav.mentors')}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mentors?.map((m: any) => (
          <div key={m.id} className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {m.profiles?.name?.[0] || 'M'}
              </div>
              <div>
                <p className="font-medium">{m.profiles?.name || 'Mentor'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Expertise</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {m.expertise?.map((e: string) => (
                    <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{e}</span>
                  ))}
                  {(!m.expertise || m.expertise.length === 0) && <span className="text-xs text-muted-foreground">-</span>}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Availability</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {m.availability?.map((a: string) => (
                    <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">{a}</span>
                  ))}
                  {(!m.availability || m.availability.length === 0) && <span className="text-xs text-muted-foreground">-</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!mentors || mentors.length === 0) && (
          <p className="col-span-full text-center text-muted-foreground py-8">{t('common.noData')}</p>
        )}
      </div>
    </DashboardLayout>
  );
}
