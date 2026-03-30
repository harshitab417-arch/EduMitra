import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createIsolatedAuthClient } from '@/lib/isolatedAuthClient';
import PageHeader from '@/components/shared/PageHeader';

export default function MentorsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === 'admin';
  const [showAddMentorForm, setShowAddMentorForm] = useState(false);
  const [mentorName, setMentorName] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorPassword, setMentorPassword] = useState('');
  const [mentorExpertiseText, setMentorExpertiseText] = useState('');
  const [mentorAvailabilityText, setMentorAvailabilityText] = useState('');

  const mentorExpertise = useMemo(
    () => mentorExpertiseText.split(',').map(s => s.trim()).filter(Boolean),
    [mentorExpertiseText],
  );
  const mentorAvailability = useMemo(
    () => mentorAvailabilityText.split(',').map(s => s.trim()).filter(Boolean),
    [mentorAvailabilityText],
  );

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

  const addMentorMutation = useMutation({
    mutationFn: async () => {
      if (!mentorName || !mentorEmail || !mentorPassword) {
        throw new Error('Name, email and password are required');
      }
      if (mentorExpertise.length === 0) {
        throw new Error('Add at least one expertise subject');
      }

      const isolatedAuth = createIsolatedAuthClient();
      const { data: signUpData, error: signUpError } = await isolatedAuth.auth.signUp({
        email: mentorEmail,
        password: mentorPassword,
        options: { data: { name: mentorName, role: 'mentor' } },
      });
      if (signUpError) throw signUpError;

      const newMentorUserId = signUpData.user?.id;
      if (!newMentorUserId) throw new Error('Mentor account was not created.');

      const { error: updateError } = await supabase
        .from('mentors')
        .update({
          expertise: mentorExpertise,
          availability: mentorAvailability,
        })
        .eq('user_id', newMentorUserId);
      if (updateError) throw updateError;
    },
    onSuccess: async () => {
      toast({ title: 'Mentor added', description: 'Mentor account and profile created successfully.' });
      setMentorName('');
      setMentorEmail('');
      setMentorPassword('');
      setMentorExpertiseText('');
      setMentorAvailabilityText('');
      setShowAddMentorForm(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['all-mentors-page'] }),
        queryClient.invalidateQueries({ queryKey: ['all-mentors'] }),
        queryClient.invalidateQueries({ queryKey: ['matching-mentors'] }),
      ]);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message || 'Failed to add mentor', variant: 'destructive' });
    },
  });

  return (
    <DashboardLayout>
      <PageHeader
        title={t('nav.mentors')}
        subtitle="Manage mentors, expertise, and availability for better matching."
        icon={<Users className="h-6 w-6 text-primary" />}
        actions={
          isAdmin ? (
            <Button variant="outline" onClick={() => setShowAddMentorForm((v) => !v)}>
              {showAddMentorForm ? 'Hide Add Mentor' : 'Add Mentor Directly'}
            </Button>
          ) : null
        }
      />

      {isAdmin && showAddMentorForm && (
        <div className="stat-card mb-4">
          <h3 className="font-semibold mb-1">Add mentor directly</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Creates a mentor account and sets expertise + availability for matching.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mentor name</p>
              <Input value={mentorName} onChange={(e) => setMentorName(e.target.value)} placeholder="e.g., Priya Sharma" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mentor email</p>
              <Input type="email" value={mentorEmail} onChange={(e) => setMentorEmail(e.target.value)} placeholder="mentor@email.com" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Temporary password</p>
              <Input type="password" value={mentorPassword} onChange={(e) => setMentorPassword(e.target.value)} placeholder="Minimum 6 characters" />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Expertise (comma-separated)</p>
              <Input
                value={mentorExpertiseText}
                onChange={(e) => setMentorExpertiseText(e.target.value)}
                placeholder="e.g., Mathematics, Physics, Chemistry"
              />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Availability (comma-separated)</p>
              <Input
                value={mentorAvailabilityText}
                onChange={(e) => setMentorAvailabilityText(e.target.value)}
                placeholder="e.g., Mon 5pm, Wed 6pm, Sat 10am"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => addMentorMutation.mutate()} disabled={addMentorMutation.isPending}>
              {addMentorMutation.isPending ? 'Adding...' : 'Add Mentor'}
            </Button>
          </div>
        </div>
      )}

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
