import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  children?: ReactNode;
}

const variantClasses = {
  default: 'bg-card border-border',
  primary: 'bg-accent border-primary/20',
  secondary: 'bg-secondary/10 border-secondary/20',
  success: 'bg-success/10 border-success/20',
  warning: 'bg-warning/10 border-warning/20',
};

const iconVariantClasses = {
  default: 'text-muted-foreground bg-muted',
  primary: 'text-primary bg-primary/10',
  secondary: 'text-secondary bg-secondary/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
};

export default function StatCard({ title, value, icon: Icon, change, variant = 'default' }: StatCardProps) {
  return (
    <div className={`stat-card border ${variantClasses[variant]} animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1 font-medium ${change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconVariantClasses[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
