import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Panel({
  title,
  meta,
  action,
  children,
  className,
  bodyClassName,
  noPadding = false,
}: {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      <header className="panel-header">
        <div className="flex items-center gap-3">
          <h2 className="panel-title">{title}</h2>
          {meta}
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </header>
      <div className={cn(noPadding ? "" : "panel-body", "flex-1 min-h-0", bodyClassName)}>{children}</div>
    </section>
  );
}
