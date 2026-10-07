import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`constra-card p-5 ${className}`}>
      {(title ?? action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-base font-bold tracking-tight">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  delta,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
}) {
  return (
    <div className="constra-card p-5">
      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      {(hint ?? delta) && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {delta && (
            <span className="mr-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              {delta}
            </span>
          )}
          {hint}
        </p>
      )}
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const tone =
    /complete|paid|approved|active/i.test(status)
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      : /progress|pending|partial|issued/i.test(status)
        ? "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
        : /overdue|failed|inactive/i.test(status)
          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span className={`constra-chip ${tone} border-transparent`}>{status}</span>
  );
}
