import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { resourceMap, LessonPlan } from '@/lib/resourceMap';
import { FolderOpen, BookOpen, Clock, Target } from 'lucide-react';

export default function ResourcesPage() {
  const { t } = useTranslation();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);

  const subjects = ['all', ...new Set(resourceMap.map(r => r.subject))];
  const filtered = selectedSubject === 'all'
    ? resourceMap
    : resourceMap.filter(r => r.subject === selectedSubject);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-primary" />
          {t('nav.resources')}
        </h1>
      </div>

      {/* Subject filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {subjects.map(s => (
          <button
            key={s}
            onClick={() => { setSelectedSubject(s); setSelectedLesson(null); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedSubject === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {selectedLesson ? (
        <div className="stat-card animate-fade-in">
          <button onClick={() => setSelectedLesson(null)} className="text-sm text-primary mb-4 hover:underline">
            ← Back to resources
          </button>
          <h2 className="text-xl font-bold mb-1">{selectedLesson.topic}</h2>
          <div className="flex gap-3 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {selectedLesson.subject}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selectedLesson.duration}</span>
            <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Grade {selectedLesson.grade}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              selectedLesson.difficulty === 'beginner' ? 'bg-success/10 text-success' :
              selectedLesson.difficulty === 'intermediate' ? 'bg-warning/10 text-warning' :
              'bg-destructive/10 text-destructive'
            }`}>{selectedLesson.difficulty}</span>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">🎯 Objectives</h3>
              <ul className="space-y-1">
                {selectedLesson.objectives.map((o, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> {o}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🎮 Activities</h3>
              <ul className="space-y-1">
                {selectedLesson.activities.map((a, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-secondary mt-0.5">•</span> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📝 Practice Questions</h3>
              <ol className="space-y-2">
                {selectedLesson.practiceQuestions.map((q, i) => (
                  <li key={i} className="text-sm p-3 rounded-lg bg-muted/50">
                    <span className="font-medium text-primary mr-2">Q{i + 1}.</span> {q}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedLesson(r)}
              className="stat-card text-left hover:border-primary/30 transition-all group"
            >
              <h3 className="font-semibold group-hover:text-primary transition-colors">{r.topic}</h3>
              <p className="text-sm text-muted-foreground mt-1">{r.subject} · Grade {r.grade}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.duration}</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  r.difficulty === 'beginner' ? 'bg-success/10 text-success' :
                  r.difficulty === 'intermediate' ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'
                }`}>{r.difficulty}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
