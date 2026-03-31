import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import { BarChart3, GraduationCap, Users, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import PageHeader from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

export default function ImpactPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { toast } = useToast();

  const { reportStart, reportEnd, trendStart } = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trendStartDate = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);
    // normalize for stable comparisons
    start.setHours(0, 0, 0, 0);
    trendStartDate.setHours(0, 0, 0, 0);
    return { reportStart: start, reportEnd: end, trendStart: trendStartDate };
  }, []);

  const reportStartIso = useMemo(() => reportStart.toISOString(), [reportStart]);
  const reportEndIso = useMemo(() => reportEnd.toISOString(), [reportEnd]);
  const trendStartIso = useMemo(() => trendStart.toISOString(), [trendStart]);

  const { data: students } = useQuery({
    queryKey: ['impact-students'],
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

  const { data: flaggedGapAlerts } = useQuery({
    queryKey: ['impact-flagged-gap-alerts', reportStartIso, reportEndIso],
    enabled: profile?.role === 'admin',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gap_alerts')
        .select('id,student_id,severity,subject,message,created_at,resolved_at')
        .eq('severity', 'flagged')
        .is('resolved_at', null);
      if (error) throw error;
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

  // ---- NGO-grade reporting (weekly donor report) ----
  const sessionsSafe = sessions || [];
  const progressSafe = progress || [];
  const studentsSafe = students || [];
  const flaggedAlertsSafe = flaggedGapAlerts || [];

  const reportSessionsInWindow = useMemo(() => {
    const startTs = reportStart.getTime();
    const endTs = reportEnd.getTime();
    return sessionsSafe.filter(s => {
      const ts = new Date(s.date).getTime();
      return ts >= startTs && ts <= endTs;
    });
  }, [sessionsSafe, reportStart, reportEnd]);

  const reportAttendance = useMemo(() => {
    const total = reportSessionsInWindow.length;
    const completed = reportSessionsInWindow.filter(s => s.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, completionRate };
  }, [reportSessionsInWindow]);

  const attendanceTrend = useMemo(() => {
    const startTs = trendStart.getTime();
    const endTs = reportEnd.getTime();
    const within = sessionsSafe.filter(s => {
      const ts = new Date(s.date).getTime();
      return ts >= startTs && ts <= endTs;
    });

    const getWeekStart = (d: Date) => {
      const x = new Date(d);
      const day = x.getDay(); // 0..6 (Sun..Sat)
      const diffToMonday = (day + 6) % 7; // makes Monday the first day of the week
      x.setDate(x.getDate() - diffToMonday);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    const weekMap = new Map<string, { weekStart: Date; total: number; completed: number }>();
    within.forEach((s: any) => {
      const d = new Date(s.date);
      const ws = getWeekStart(d);
      const key = ws.toISOString().slice(0, 10);
      if (!weekMap.has(key)) weekMap.set(key, { weekStart: ws, total: 0, completed: 0 });
      const entry = weekMap.get(key)!;
      entry.total += 1;
      if (s.status === 'completed') entry.completed += 1;
    });

    return Array.from(weekMap.values())
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
      .map((entry) => ({
        week_start: entry.weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        total_sessions: entry.total,
        completed_sessions: entry.completed,
        completion_rate: entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0,
        week_start_iso: entry.weekStart.toISOString().slice(0, 10),
      }));
  }, [sessionsSafe, trendStart, reportEnd]);

  const learningGain = useMemo(() => {
    const startTs = reportStart.getTime();
    const endTs = reportEnd.getTime();
    const within = progressSafe.filter(p => {
      const ts = new Date(p.assessment_date).getTime();
      return ts >= startTs && ts <= endTs;
    });

    const byStudent = new Map<string, any[]>();
    within.forEach((p: any) => {
      const arr = byStudent.get(p.student_id) || [];
      arr.push(p);
      byStudent.set(p.student_id, arr);
    });

    const studentById = new Map<string, any>();
    studentsSafe.forEach((s: any) => studentById.set(s.id, s));

    const rows: Array<{
      student_id: string;
      student_name: string;
      grade: number;
      subjects: string;
      earliest_date: string;
      earliest_avg_score: number;
      latest_date: string;
      latest_avg_score: number;
      learning_gain: number;
    }> = [];

    byStudent.forEach((items, studentId) => {
      if (!items.length) return;
      const times = items.map((x: any) => new Date(x.assessment_date).getTime());
      const minTs = Math.min(...times);
      const maxTs = Math.max(...times);

      const firstScores = items.filter((x: any) => new Date(x.assessment_date).getTime() === minTs);
      const lastScores = items.filter((x: any) => new Date(x.assessment_date).getTime() === maxTs);

      const earliestAvg = Math.round(firstScores.reduce((a: number, b: any) => a + b.score, 0) / firstScores.length);
      const latestAvg = Math.round(lastScores.reduce((a: number, b: any) => a + b.score, 0) / lastScores.length);

      const student = studentById.get(studentId);
      const subjectsArr: string[] = student?.subjects || [];

      rows.push({
        student_id: studentId,
        student_name: student?.profiles?.name || 'Student',
        grade: student?.grade ?? 0,
        subjects: subjectsArr.join('|'),
        earliest_date: new Date(minTs).toLocaleDateString('en-IN'),
        earliest_avg_score: earliestAvg,
        latest_date: new Date(maxTs).toLocaleDateString('en-IN'),
        latest_avg_score: latestAvg,
        learning_gain: latestAvg - earliestAvg,
      });
    });

    const meaningful = rows.filter(r => r.latest_date !== r.earliest_date);
    const avgLearningGain =
      meaningful.length > 0
        ? Math.round(meaningful.reduce((s, r) => s + r.learning_gain, 0) / meaningful.length)
        : 0;

    return { rows, avgLearningGain };
  }, [progressSafe, reportStart, reportEnd, studentsSafe]);

  const flaggedStudents = useMemo(() => {
    const studentById = new Map<string, any>();
    studentsSafe.forEach((s: any) => studentById.set(s.id, s));

    return flaggedAlertsSafe
      .map((a: any) => {
        const student = studentById.get(a.student_id);
        return {
          alert_id: a.id,
          student_id: a.student_id,
          student_name: student?.profiles?.name || 'Student',
          grade: student?.grade ?? 0,
          subjects: (student?.subjects || []).join('|'),
          severity: a.severity,
          subject: a.subject || 'General',
          intervention_note: a.message || '',
          created_at: a.created_at ? new Date(a.created_at).toLocaleString('en-IN') : '',
        };
      })
      .sort((x: any, y: any) => (y.created_at || '').localeCompare(x.created_at || ''));
  }, [flaggedAlertsSafe, studentsSafe]);

  const newlyFlaggedCount = useMemo(() => {
    const startTs = reportStart.getTime();
    const endTs = reportEnd.getTime();
    return flaggedAlertsSafe.filter((a: any) => {
      const ts = new Date(a.created_at).getTime();
      return ts >= startTs && ts <= endTs;
    }).length;
  }, [flaggedAlertsSafe, reportStart, reportEnd]);

  const canDownload = profile?.role === 'admin' && reportSessionsInWindow !== undefined && flaggedGapAlerts !== undefined;
  const reportReady = canDownload && sessions !== undefined && progress !== undefined && students !== undefined && flaggedGapAlerts !== undefined;

  const csvEscape = (value: any) => {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const downloadCSV = () => {
    if (!reportReady) return;

    const lines: string[] = [];
    const startLabel = reportStart.toLocaleDateString('en-IN');
    const endLabel = reportEnd.toLocaleDateString('en-IN');

    lines.push('Weekly Donor Report (CSV)');
    lines.push(`report_period_start,${csvEscape(startLabel)}`);
    lines.push(`report_period_end,${csvEscape(endLabel)}`);
    lines.push('');

    lines.push('Attendance Trend (last 4 weeks)');
    lines.push('week_start,total_sessions,completed_sessions,completion_rate');
    attendanceTrend.forEach((w: any) => {
      lines.push([w.week_start_iso, w.total_sessions, w.completed_sessions, `${w.completion_rate}%`].map(csvEscape).join(','));
    });
    lines.push('');

    lines.push('Learning Gain (last 7 days)');
    lines.push('student_name,grade,subjects,earliest_date,earliest_avg_score,latest_date,latest_avg_score,learning_gain');
    learningGain.rows.forEach((r: any) => {
      lines.push(
        [r.student_name, r.grade, r.subjects, r.earliest_date, r.earliest_avg_score, r.latest_date, r.latest_avg_score, r.learning_gain]
          .map(csvEscape)
          .join(','),
      );
    });
    lines.push(`Average Learning Gain,${learningGain.avgLearningGain}`);
    lines.push('');

    lines.push('Flagged Students (active)');
    lines.push('student_name,grade,subjects,severity,intervention_note,alert_subject,created_at');
    flaggedStudents.forEach((s: any) => {
      lines.push([s.student_name, s.grade, s.subjects, s.severity, s.intervention_note, s.subject, s.created_at].map(csvEscape).join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `weekly-donor-report_${reportStartIso.slice(0, 10)}_to_${reportEndIso.slice(0, 10)}.csv`;
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (!reportReady) return;

    const startLabel = reportStart.toLocaleDateString('en-IN');
    const endLabel = reportEnd.toLocaleDateString('en-IN');
    const flaggedPreview = flaggedStudents.slice(0, 8);

    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = 36;
    let y = 54;
    const maxWidth = pageWidth - left * 2;

    const splitLines = (text: string) => doc.splitTextToSize(text, maxWidth);
    const addText = (text: string, size = 11, opts?: { bold?: boolean }) => {
      const lines = splitLines(text);
      doc.setFontSize(size);
      if (opts?.bold) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');

      for (const line of lines) {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 54;
        }
        doc.text(line, left, y);
        y += size + 2.5;
      }
      y += 2;
    };

    const truncate = (value: string, n: number) =>
      value.length > n ? `${value.slice(0, n - 1)}…` : value;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Weekly Donor Report', left, 36);
    y = 54;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addText(`Period: ${startLabel} - ${endLabel} (generated from live Supabase data)`, 10);

    addText(`Attendance: ${reportAttendance.completed}/${reportAttendance.total} sessions (${reportAttendance.completionRate}% completion)`, 11, { bold: true });
    addText(`Learning Gain: avg ${learningGain.avgLearningGain} pts (last 7 days)`, 11);
    addText(`Flagged Students: ${flaggedStudents.length} active (${newlyFlaggedCount} newly flagged in period)`, 11);

    addText('Attendance Trend (last 4 weeks)', 12, { bold: true });
    attendanceTrend.forEach((w: any) => {
      addText(`- ${w.week_start}: ${w.completed_sessions}/${w.total_sessions} (${w.completion_rate}%)`, 10);
    });

    addText('Flagged Students (active) + Intervention Notes', 12, { bold: true });
    if (!flaggedPreview.length) {
      addText('No flagged students to report for this period.', 11);
    } else {
      flaggedPreview.forEach((s: any, idx: number) => {
        addText(`${idx + 1}. ${s.student_name} (Grade ${s.grade})`, 10, { bold: true });
        addText(`Subjects: ${s.subjects}`, 9);
        addText(`Alert Subject: ${s.subject}`, 9);
        addText(`Intervention Note: ${truncate(s.intervention_note || '', 140)}`, 9);
        addText(`Created: ${s.created_at}`, 9);
      });
      if (flaggedStudents.length > flaggedPreview.length) {
        addText(`Showing top ${flaggedPreview.length}. +${flaggedStudents.length - flaggedPreview.length} more flagged students not included.`, 9);
      }
    }

    const filename = `weekly-donor-report_${reportStartIso.slice(0, 10)}_to_${reportEndIso.slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={`${t('nav.impact')} Dashboard`}
        subtitle="Live program metrics: sessions, coverage, and learning trends."
        icon={<BarChart3 className="h-6 w-6 text-primary" />}
      />

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

      <div className="stat-card mb-6">
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

      <div className="stat-card border border-border/60">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-lg">Weekly Donor Report</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Attendance trend, learning gain, and flagged students with intervention notes.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Period: {reportStart.toLocaleDateString('en-IN')} - {reportEnd.toLocaleDateString('en-IN')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={downloadCSV} disabled={!reportReady}>
              Download CSV
            </Button>
            <Button size="sm" variant="outline" onClick={downloadPDF} disabled={!reportReady}>
              Download PDF
            </Button>
          </div>
        </div>

        {profile?.role !== 'admin' ? (
          <p className="text-muted-foreground text-sm">Admin access is required to export donor reports.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="text-lg font-bold mt-1">
                  {reportAttendance.completed}/{reportAttendance.total} <span className="text-sm text-muted-foreground">({reportAttendance.completionRate}%)</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <p className="text-xs text-muted-foreground">Learning Gain</p>
                <p className="text-lg font-bold mt-1">{learningGain.avgLearningGain} pts avg</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <p className="text-xs text-muted-foreground">Flagged Students</p>
                <p className="text-lg font-bold mt-1">{flaggedStudents.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{newlyFlaggedCount} newly flagged in this period</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Flagged Student</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Grade</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subjects</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Intervention Note</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedStudents.length > 0 ? (
                    flaggedStudents.slice(0, 6).map((s: any) => (
                      <tr key={s.alert_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{s.student_name}</td>
                        <td className="py-3 px-4">{s.grade}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {(s.subjects || '').split('|').filter(Boolean).slice(0, 3).map((subj: string) => (
                              <span key={subj} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                                {subj}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground note">{s.intervention_note}</td>
                        <td className="py-3 px-4 text-muted-foreground">{s.created_at}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No active flagged students at the moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
