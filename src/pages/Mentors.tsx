import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function MentorsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === 'admin';

  const { data: mentors } = useQuery({
    queryKey: ['all-mentors-page'],
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

  const removeMentorMutation = useMutation({
    mutationFn: async (mentorId: string) => {
      const { error } = await supabase.from('mentors').delete().eq('id', mentorId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: 'Mentor removed' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['all-mentors-page'] }),
        queryClient.invalidateQueries({ queryKey: ['all-mentors'] }),
        queryClient.invalidateQueries({ queryKey: ['matching-mentors'] }),
      ]);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message || 'Failed to remove mentor', variant: 'destructive' });
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
            {isAdmin && (
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const ok = window.confirm(`Remove mentor "${m.profiles?.name || 'Mentor'}"?`);
                    if (ok) removeMentorMutation.mutate(m.id);
                  }}
                  disabled={removeMentorMutation.isPending}
                >
                  Remove Mentor
                </Button>
              </div>
            )}
          </div>
        ))}
        {(!mentors || mentors.length === 0) && (
          <p className="col-span-full text-center text-muted-foreground py-8">{t('common.noData')}</p>
        )}
      </div>
    </DashboardLayout>
  );
}
