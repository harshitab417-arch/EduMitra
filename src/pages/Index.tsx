import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  GraduationCap,
  Users,
  BarChart3,
  ArrowRight,
  Globe,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Index() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  };

  const features = [
    { icon: GraduationCap, title: t('home.features.progressTitle'), desc: t('home.features.progressDesc'), tag: 'Progress' },
    { icon: Users, title: t('home.features.matchingTitle'), desc: t('home.features.matchingDesc'), tag: 'Matching' },
    { icon: BarChart3, title: t('home.features.impactTitle'), desc: t('home.features.impactDesc'), tag: 'Impact' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-7 w-7" />
            <span className="text-xl font-bold tracking-tight">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              {i18n.language === 'en' ? 'हिंदी' : 'English'}
            </button>
            <Button
              size="sm"
              onClick={() => navigate('/login')}
              className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-transparent dark:text-foreground dark:hover:bg-accent"
            >
              {t('nav.login')}
            </Button>
            <Button size="sm" onClick={() => navigate('/signup')}>
              {t('nav.signup')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-center">
            <div className="space-y-6 animate-fade-in">
              <Badge className="bg-white/10 text-xs uppercase tracking-wide border-white/20">
                {t('home.featuresHeading')}
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                <span className="block">{t('app.tagline')}</span>
                <span className="mt-2 inline-block bg-black/10 px-2 py-1 rounded-md text-sm font-medium lg:bg-black/15">
                  {t('home.heroDescription')}
                </span>
              </h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold">3</span>
                  <span className="text-primary-foreground/80">Core workflows</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold">4</span>
                  <span className="text-primary-foreground/80">Critical issues solved</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold">100%</span>
                  <span className="text-primary-foreground/80">Session data captured</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
                >
                  {t('home.getStarted')} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="bg-violet-600 text-white hover:bg-violet-700 border border-violet-500"
                >
                  {t('nav.login')}
                </Button>
              </div>
            </div>

            <Card className="bg-card/90 text-card-foreground shadow-lg border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Session-ready lesson plans
                </CardTitle>
                <CardDescription>
                  Browse structured plans by subject, grade, or need before every session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Search resources (e.g. Fractions, Reading, Algebra)"
                    className="pl-9 bg-background/80"
                  />
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Mathematics</Badge>
                  <Badge variant="outline">Science</Badge>
                  <Badge variant="outline">English</Badge>
                  <Badge variant="outline">Commerce</Badge>
                  <Badge variant="outline">Foundational skills</Badge>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Example flows:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Pick lesson → Start session → Log outcomes</li>
                    <li>See flagged gaps → Pin follow-up resources</li>
                    <li>Mentor changes → new mentor resumes from last milestone</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-10 lg:py-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold">
            {t('home.featuresHeading')}
          </h2>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Designed for NGOs, students and volunteers.
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {features.map((f, i) => (
            <Card key={i} className="group h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    {f.tag}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm mb-3">
                  {f.desc}
                </CardDescription>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {i === 0 && (
                    <>
                      <li>• Topic-level milestones per student</li>
                      <li>• Scores and sessions visualized over time</li>
                      <li>• Fast logging from any device</li>
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <li>• Subject, level, and availability-aware matching</li>
                      <li>• Transparent scores and reasons for each match</li>
                      <li>• Admin override with data context</li>
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <li>• Live counts for on-track vs at-risk learners</li>
                      <li>• Top learning gaps across all programs</li>
                      <li>• Session trends ready for donor decks</li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{t('home.footer')}</p>
        </div>
      </footer>
    </div>
  );
}
