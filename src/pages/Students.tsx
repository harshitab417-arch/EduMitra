import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { GraduationCap } from 'lucide-react';

export default function StudentsPage() {
  const { t } = useTranslation();

  const { data: students } = useQuery({
    queryKey: ['all-students-page'],
    queryFn: async () => {
      const { data } = await supabase.from('students').select('*, profiles!inner(name)');
      return data || [];
    },
  });

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
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('common.grade')}</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('student.subjects')}</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Level</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
            </tr>
          </thead>
          <tbody>
            {students?.map((s: any) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-medium">{s.profiles?.name || '-'}</td>
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
              </tr>
            ))}
            {(!students || students.length === 0) && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
