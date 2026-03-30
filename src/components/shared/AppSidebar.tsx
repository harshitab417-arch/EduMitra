import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen, LayoutDashboard, Users, GraduationCap,
  Calendar, FolderOpen, BarChart3, Shuffle, LogOut, Globe
} from 'lucide-react';

export default function AppSidebar() {
  const { t, i18n } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role || 'student';

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  };

  const navItems = {
    student: [
      { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
      { to: '/progress', icon: BarChart3, label: t('nav.progress') },
      { to: '/sessions', icon: Calendar, label: t('nav.sessions') },
      { to: '/resources', icon: FolderOpen, label: t('nav.resources') },
    ],
    mentor: [
      { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
      { to: '/students', icon: GraduationCap, label: t('nav.students') },
      { to: '/sessions', icon: Calendar, label: t('nav.sessions') },
      { to: '/resources', icon: FolderOpen, label: t('nav.resources') },
    ],
    admin: [
      { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
      { to: '/students', icon: GraduationCap, label: t('nav.students') },
      { to: '/mentors', icon: Users, label: t('nav.mentors') },
      { to: '/sessions', icon: Calendar, label: t('nav.sessions') },
      { to: '/matching', icon: Shuffle, label: t('nav.matching') },
      { to: '/resources', icon: FolderOpen, label: t('nav.resources') },
      { to: '/impact', icon: BarChart3, label: t('nav.impact') },
    ],
  };

  const items = navItems[role] || navItems.student;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen gradient-hero flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 text-primary-foreground">
          <BookOpen className="h-7 w-7" />
          <span className="text-xl font-bold">EduMitra</span>
        </div>
        {profile && (
          <div className="mt-4 text-primary-foreground/80 text-sm">
            <p className="font-medium text-primary-foreground">{profile.name}</p>
            <p className="capitalize">{role}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-primary-foreground/70 hover:bg-sidebar-accent/50 hover:text-primary-foreground'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 space-y-1">
        <button
          onClick={toggleLang}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary-foreground/70 hover:bg-sidebar-accent/50 hover:text-primary-foreground transition-colors"
        >
          <Globe className="h-4 w-4" />
          {i18n.language === 'en' ? 'हिंदी' : 'English'}
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary-foreground/70 hover:bg-sidebar-accent/50 hover:text-primary-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
