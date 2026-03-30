import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, GraduationCap, Users, BarChart3, ArrowRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  };

  const features = [
    { icon: GraduationCap, title: 'Student Progress Tracking', desc: 'Track learning outcomes with visual dashboards and gap analysis' },
    { icon: Users, title: 'Smart Mentor Matching', desc: 'AI-powered matching based on expertise, availability & student needs' },
    { icon: BarChart3, title: 'NGO Impact Dashboard', desc: 'Measure and visualize your organization\'s real-world impact' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-7 w-7" />
            <span className="text-xl font-bold">EduMitra</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Globe className="h-4 w-4" />
              {i18n.language === 'en' ? 'हिंदी' : 'English'}
            </button>
            <Button variant="ghost" onClick={() => navigate('/login')}>{t('nav.login')}</Button>
            <Button onClick={() => navigate('/signup')}>{t('nav.signup')}</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-2xl animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
              {t('app.tagline')}
            </h1>
            <p className="text-lg opacity-90 mb-8 leading-relaxed">
              A comprehensive learning support platform that helps NGOs track student progress, 
              match mentors effectively, and measure real impact in underserved communities.
            </p>
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/signup')}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                {t('nav.login')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">
          Built for Education Equity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="stat-card text-center group animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>EduMitra — Empowering education for every child in India 🇮🇳</p>
        </div>
      </footer>
    </div>
  );
}
