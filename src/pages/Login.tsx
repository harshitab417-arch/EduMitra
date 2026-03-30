import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, GraduationCap, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground animate-fade-in">
          <Link to="/" className="inline-flex items-center gap-3 mb-8 hover:opacity-90 transition-opacity">
            <BookOpen className="h-10 w-10" />
            <h1 className="text-3xl font-bold">EduMitra</h1>
          </Link>
          <p className="text-xl mb-8 opacity-90">{t('app.tagline')}</p>
          <div className="space-y-4 opacity-80">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5" />
              <span>Track student progress & learning gaps</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <span>Smart mentor-student matching</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" />
              <span>Measure & scale NGO impact</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in bg-card/80 backdrop-blur rounded-2xl border border-border/60 shadow-lg p-6 sm:p-8">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-8 text-primary hover:opacity-90 transition-opacity">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-2xl font-bold">EduMitra</h1>
          </Link>
          
          <h2 className="text-2xl font-bold mb-2">{t('auth.loginTitle')}</h2>
          <p className="text-muted-foreground mb-8">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('nav.login')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              {t('nav.signup')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
