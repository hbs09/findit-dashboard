import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-white border border-slate-200 rounded-2xl overflow-hidden",
        className
      )}
    >
      {(title || action) && (
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="font-semibold text-slate-900 truncate">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
