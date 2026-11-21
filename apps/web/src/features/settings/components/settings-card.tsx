import type { ReactNode } from "react";
import { cn } from "@ceylonweddings/ui/utils";

/** One settings block: title + description, body, optional footer actions. */
export function SettingsCard({
  title,
  description,
  action,
  footer,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Right side of the header (status badge, toggle…). */
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card card--raised overflow-hidden", className)}>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="grid gap-1">
          <h2 className="font-serif text-h3 text-foreground">{title}</h2>
          {description ? <p className="max-w-prose text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="grid gap-4 px-5 pb-5 sm:px-6 sm:pb-6">{children}</div> : null}
      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-inset px-5 py-3 sm:px-6">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

/** A label / value row inside a SettingsCard. Pass `htmlFor` so the control is labelled. */
export function SettingsRow({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  const hintId = htmlFor && hint ? `${htmlFor}-hint` : undefined;
  return (
    <div className="grid gap-2 sm:grid-cols-[14rem_1fr] sm:items-center sm:gap-6">
      <div className="grid gap-0.5">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-compact font-medium text-foreground">
            {label}
          </label>
        ) : (
          <span className="text-compact font-medium text-foreground">{label}</span>
        )}
        {hint ? (
          <span id={hintId} className="text-caption text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
