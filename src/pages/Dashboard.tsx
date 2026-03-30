import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/shared/DashboardLayout';
import StudentDashboard from '@/components/student/StudentDashboard';
import MentorDashboard from '@/components/mentor/MentorDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import PageHeader from '@/components/shared/PageHeader';
import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const role = profile?.role || 'student';

  return (
    <DashboardLayout>
      <PageHeader
        title={`${t('dashboard.welcome')}, ${profile?.name || 'User'}`}
        subtitle={`${role} ${t('nav.dashboard')}`}
        icon={<LayoutDashboard className="h-6 w-6 text-primary" />}
      />
      {role === 'student' && <StudentDashboard />}
      {role === 'mentor' && <MentorDashboard />}
      {role === 'admin' && <AdminDashboard />}
    </DashboardLayout>
  );
}
