import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'mentor' | 'admin'>('student');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, name, role);
      toast({ title: 'Success', description: 'Account created! Please check your email to confirm.' });
      navigate('/login');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'student' as const, label: t('auth.student'), emoji: '🎓' },
    { value: 'mentor' as const, label: t('auth.mentor'), emoji: '🤝' },
    { value: 'admin' as const, label: t('auth.admin'), emoji: '🏢' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 text-primary hover:opacity-90 transition-opacity">
          <BookOpen className="h-8 w-8" />
          <h1 className="text-2xl font-bold">EduMitra</h1>
        </Link>

        <h2 className="text-2xl font-bold mb-2">{t('auth.signupTitle')}</h2>
        <p className="text-muted-foreground mb-8">{t('auth.signupSubtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('auth.name')}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1" />
          </div>
          <div>
            <Label>{t('auth.role')}</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-lg border text-center text-sm font-medium transition-all ${
                    role === r.value
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg block mb-1">{r.emoji}</span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : t('nav.signup')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
