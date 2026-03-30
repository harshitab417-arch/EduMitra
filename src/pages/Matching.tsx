import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Shuffle, Zap } from 'lucide-react';
import { findBestMatches, StudentProfile, MentorProfile } from '@/lib/matcher';
import { useToast } from '@/hooks/use-toast';

export default function MatchingPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [results, setResults] = useState<any[]>([]);

  const { data: students } = useQuery({
    queryKey: ['matching-students'],
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
    queryKey: ['matching-mentors'],
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

  const { data: existingMatches } = useQuery({
    queryKey: ['existing-matches'],
    queryFn: async () => {
      const { data } = await supabase.from('matches').select('*');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (matches: any[]) => {
      const inserts = matches.map(m => ({
        student_id: m.student_id,
        mentor_id: m.mentor_id,
        match_score: m.match_score,
        status: 'active',
      }));
      const { error } = await supabase.from('matches').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Matches saved successfully!' });
      queryClient.invalidateQueries({ queryKey: ['existing-matches'] });
      setResults([]);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const runMatching = () => {
    if (!students?.length || !mentors?.length) {
      toast({ title: 'Need students and mentors to run matching', variant: 'destructive' });
      return;
    }

    const studentProfiles: StudentProfile[] = students.map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      grade: s.grade,
      subjects: s.subjects || [],
      baseline_level: s.baseline_level,
    }));

    const mentorProfiles: MentorProfile[] = mentors.map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      expertise: m.expertise || [],
      availability: m.availability || [],
      name: m.profiles?.name,
    }));

    const matches = findBestMatches(studentProfiles, mentorProfiles);
    
    // Enrich with names
    const enriched = matches.map(m => ({
      ...m,
      studentName: (students as any[]).find((s) => s.id === m.student_id)?.profiles?.name || 'Student',
      mentorName: (mentors as any[]).find((mt) => mt.id === m.mentor_id)?.profiles?.name || 'Mentor',
    }));

    setResults(enriched);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shuffle className="h-6 w-6 text-primary" />
          {t('nav.matching')}
        </h1>
        <Button onClick={runMatching} className="gap-2">
          <Zap className="h-4 w-4" /> Run Auto-Match
        </Button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="stat-card mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">New Matches ({results.length})</h3>
            <Button size="sm" onClick={() => saveMutation.mutate(results)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save All Matches'}
            </Button>
          </div>
          <div className="space-y-2">
            {results.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{m.studentName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium text-sm">{m.mentorName}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary">{m.match_score}%</span>
                  <p className="text-xs text-muted-foreground">{m.reasons?.[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Matches */}
      <div className="stat-card">
        <h3 className="font-semibold mb-4">Current Matches</h3>
        {existingMatches && existingMatches.length > 0 ? (
          <div className="space-y-2">
            {existingMatches.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">
                    {(students as any[])?.find(s => s.id === m.student_id)?.profiles?.name || 'Student'}
                  </span>
                  <span className="text-muted-foreground">↔</span>
                  <span className="font-medium text-sm">
                    {(mentors as any[])?.find(mt => mt.id === m.mentor_id)?.profiles?.name || 'Mentor'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{m.match_score}%</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">{t('common.noData')}</p>
        )}
      </div>
    </DashboardLayout>
  );
}
