import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StudentDashboard from '@/components/student/StudentDashboard';
import MentorDashboard from '@/components/mentor/MentorDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const role = profile?.role || 'student';

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {t('dashboard.welcome')}, {profile?.name || 'User'} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1 capitalize">{role} {t('nav.dashboard')}</p>
      </div>
      {role === 'student' && <StudentDashboard />}
      {role === 'mentor' && <MentorDashboard />}
      {role === 'admin' && <AdminDashboard />}
    </DashboardLayout>
  );
}
