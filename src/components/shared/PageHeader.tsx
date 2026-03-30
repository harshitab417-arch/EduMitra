import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
          </div>
          {subtitle ? <p className="text-sm text-muted-foreground mt-1">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0 flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

