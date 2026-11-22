"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Check, ChevronDown, Smartphone, X } from "lucide-react";
import { cn } from "../lib/utils";
import { fieldLabel } from "../contracts/field";
import { Icon, type IconComponent } from "../components/icon";
import { IconButton } from "../components/icon-button";
import {
  motion,
  useReducedMotion,
  Reveal,
  AnimatePresence,
  drawerVariants,
  PulseDot,
  AnimatedCollapsible,
} from "./motion";

export function FormSection({
  title,
  description,
  icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: IconComponent;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Reveal data-slot="form-section" className={cn("grid gap-6", className)} y={10}>
      <div className="grid gap-1.5 border-b border-border/50 pb-4">
        <div className="flex items-center gap-2.5">
          {icon ? (
            <span className="grid size-8 place-items-center rounded-full border border-border/60 bg-secondary/40 text-muted-foreground">
              <Icon icon={icon} size="sm" />
            </span>
          ) : null}
          <h2 className="font-serif text-xl tracking-tight md:text-2xl">{title}</h2>
        </div>
        {description ? <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid gap-5">{children}</div>
    </Reveal>
  );
}

/** A titled card that groups related fields inside a FormSection. */
export function FormGroup({
  title,
  description,
  icon,
  aside,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: IconComponent;
  /** Right-aligned extra (e.g. a live summary or a count). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-slot="form-group"
      className={cn("grid gap-4 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5", className)}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon icon={icon} size="sm" />
            </span>
          ) : null}
          <div className="grid min-w-0 gap-0.5">
            <h3 className="text-sm font-medium tracking-tight text-foreground">{title}</h3>
            {description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        {aside ? <div className="shrink-0 text-xs text-muted-foreground">{aside}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function FieldBlock({
  label,
  hint,
  children,
  className,
  compact = false,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  htmlFor?: string;
}) {
  return (
    <div data-slot="field-block" className={cn(compact ? "grid gap-1.5" : "grid gap-2", className)}>
      <div className="grid gap-1">
        <label htmlFor={htmlFor} className={fieldLabel}>
          {label}
        </label>
        {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function FormPanel({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      data-slot="form-panel"
      className={cn(
        "grid gap-5 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-sm md:p-6",
        className,
      )}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function FormGrid({
  children,
  cols = 2,
  className,
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}) {
  return (
    <div
      data-slot="form-grid"
      className={cn(
        "grid gap-4",
        cols === 1 && "grid-cols-1",
        cols === 2 && "md:grid-cols-2",
        cols === 3 && "md:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        cols === 5 && "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function InlineFieldRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-slot="inline-field-row" className={cn("flex flex-wrap items-end gap-3", className)}>
      {children}
    </div>
  );
}

export function CompletenessChecklist({
  score,
  total,
  missing,
  ready,
}: {
  score: number;
  total: number;
  missing: string[];
  ready: boolean;
}) {
  const percent = Math.round((score / Math.max(total, 1)) * 100);
  return (
    <div className="grid gap-3 rounded-2xl border border-border/80 bg-card/80 p-5 text-sm shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium tracking-tight">Listing completeness</p>
        <p className={cn("text-xs font-medium", ready ? "text-primary" : "text-muted-foreground")}>
          {score}/{total} · {percent}%
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      {missing.length ? (
        <p className="text-xs leading-relaxed text-muted-foreground">Still need: {missing.join(" · ")}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Ready for couples — publish with confidence.</p>
      )}
    </div>
  );
}

export function StickyActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-slot="sticky-action-bar"
      className={cn(
        "sticky bottom-0 z-20 mt-2 flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-card/95 px-4 py-3 shadow-dock backdrop-blur",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type CreatorSection = {
  id: string;
  label: string;
  done?: boolean;
  /** Lucide icon shown in the step tile (falls back to the step number). */
  icon?: IconComponent;
  /** One-line helper under the label. */
  hint?: string;
};

export function CreatorSectionNav({
  sections,
  active,
  onSelect,
  showProgress,
}: {
  sections: CreatorSection[];
  active: string;
  onSelect: (id: string) => void;
  /** Show "n of m complete" with a progress bar above the steps (default: on when any step has an icon). */
  showProgress?: boolean;
}) {
  const doneCount = sections.filter((section) => section.done).length;
  const withProgress = showProgress ?? sections.some((section) => section.icon);

  return (
    <nav
      aria-label="Sections"
      className={cn(
        "rounded-2xl border border-border/50 bg-card/40 p-1.5",
        // Below xl: a horizontally scrolling tab strip above the form.
        "flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        // xl+: the sticky vertical step list beside the form.
        "xl:sticky xl:top-24 xl:grid xl:gap-1 xl:overflow-visible xl:p-2",
      )}
    >
      {withProgress ? (
        <div className="mb-1 hidden gap-2 px-2.5 pt-1.5 pb-2 xl:grid">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-medium text-foreground">Progress</span>
            <span className="text-muted-foreground tabular-nums">
              {doneCount} of {sections.length} complete
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${(doneCount / Math.max(sections.length, 1)) * 100}%` }}
            />
          </div>
        </div>
      ) : null}
      {sections.map((section, index) => {
        const isActive = active === section.id;
        return (
          <button
            key={section.id}
            type="button"
            aria-current={isActive ? "step" : undefined}
            onClick={() => onSelect(section.id)}
            className={cn(
              "group relative flex shrink-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition duration-200 xl:gap-3",
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="creator-section-indicator"
                className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid shrink-0 place-items-center rounded-lg text-label font-medium",
                section.icon ? "size-8" : "size-6 rounded-full",
                isActive
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : section.done
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-foreground/70",
              )}
            >
              {section.icon ? <Icon icon={section.icon} size="sm" /> : section.done ? "✓" : index + 1}
              {section.icon && section.done ? (
                <span
                  aria-label="Complete"
                  className={cn(
                    "absolute -right-1 -bottom-1 grid size-3.5 place-items-center rounded-full ring-2",
                    isActive
                      ? "bg-primary-foreground text-primary ring-primary"
                      : "bg-primary text-primary-foreground ring-background",
                  )}
                >
                  <Check className="size-2.5" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
            </span>
            <span className="relative z-10 grid min-w-0 gap-0.5">
              <span className="truncate font-medium tracking-tight">{section.label}</span>
              {section.hint ? (
                <span
                  className={cn(
                    "hidden truncate text-xs xl:block",
                    isActive ? "text-primary-foreground/75" : "text-muted-foreground/80",
                  )}
                >
                  {section.hint}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function TagInput({
  values,
  onChange,
  placeholder = "Add and press Enter",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2.5 rounded-xl border border-input bg-background/60 p-3 transition-[border-color,box-shadow] duration-200 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <button
              key={`${index}-${value}`}
              type="button"
              className="rounded-full border border-border/60 bg-secondary/80 px-3 py-1 text-xs transition hover:border-destructive/40 hover:text-destructive"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              {value} ×
            </button>
          ))}
        </div>
      ) : null}
      <input
        className="h-9 w-full rounded-lg border-0 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          const value = event.currentTarget.value.trim();
          if (!value || values.includes(value)) return;
          onChange([...values, value]);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}

export function StudioCollapse({
  open,
  onOpenChange,
  title,
  subtitle,
  leading,
  action,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const panelId = useId();
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/70 bg-card/40", className)}>
      <div className="flex items-center gap-1 p-2 md:p-2.5">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onOpenChange(!open)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 py-1 text-left outline-none transition hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {leading}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium tracking-tight">{title}</span>
            {subtitle && !open ? (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>
            ) : null}
          </span>
          <Icon
            icon={ChevronDown}
            size="sm"
            lottie={false}
            className={cn("shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          />
        </button>
        {action}
      </div>
      <AnimatedCollapsible isOpen={open}>
        <div id={panelId} className="grid gap-4 border-t border-border/50 px-3 pt-3 pb-3 md:px-4 md:pb-4">
          {children}
        </div>
      </AnimatedCollapsible>
    </div>
  );
}

export type StudioPreviewControls = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

export function StudioShell({
  nav,
  preview,
  previewLabel = "Live preview",
  previewTitle,
  previewHint,
  previewThumb,
  previewFooter,
  defaultPreviewOpen = false,
  children,
}: {
  nav: ReactNode;
  preview?: ReactNode;
  previewLabel?: string;
  previewTitle?: string;
  previewHint?: string;
  previewThumb?: string | null;
  previewFooter?: ReactNode;
  /** Open the preview on mount when the viewport is wide enough to sit it beside the form. */
  defaultPreviewOpen?: boolean;
  children: ReactNode | ((preview: StudioPreviewControls) => ReactNode);
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (defaultPreviewOpen && window.matchMedia("(min-width: 96rem)").matches) setOpen(true);
  }, [defaultPreviewOpen]);
  const controls: StudioPreviewControls = {
    open,
    setOpen,
    toggle: () => setOpen((value) => !value),
  };
  const body = typeof children === "function" ? children(controls) : children;

  return (
    <div className="relative grid gap-8 xl:grid-cols-[15.5rem_minmax(0,1fr)] xl:items-start">
      <aside className="min-w-0">{nav}</aside>
      <div
        className={cn(
          "min-w-0 grid gap-6 transition-[padding] duration-300 ease-out motion-reduce:transition-none",
          open && "xl:pr-[min(27rem,42vw)]",
        )}
      >
        {body}
      </div>
      {preview ? (
        <StudioPreviewStage
          open={open}
          onOpenChange={setOpen}
          label={previewLabel}
          title={previewTitle}
          hint={previewHint}
          thumb={previewThumb}
          footer={previewFooter}
        >
          {preview}
        </StudioPreviewStage>
      ) : null}
    </div>
  );
}

function StudioPreviewStage({
  open,
  onOpenChange,
  label,
  title,
  hint,
  thumb,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  title?: string;
  hint?: string;
  thumb?: string | null;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.aside
            key="studio-preview-panel"
            id={panelId}
            role="dialog"
            aria-modal="false"
            aria-label={label}
            className="fixed z-40 flex w-[min(26rem,calc(100vw-1.25rem))] flex-col overflow-hidden rounded-[1.85rem] border border-border/70 bg-card/95 shadow-floating backdrop-blur-xl"
            style={{
              top: "calc(var(--cw-frame-top) + 5rem)",
              right: "calc(var(--cw-frame-right) + 0.7rem)",
              bottom: "calc(var(--cw-frame-bottom) + 0.7rem)",
            }}
            initial={reduce ? false : "hidden"}
            animate="show"
            exit={reduce ? undefined : "exit"}
            variants={drawerVariants("right")}
          >
            <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
              <PulseDot />
              <div className="min-w-0 flex-1">
                <p className="text-label font-medium tracking-eyebrow text-primary/90 uppercase">{label}</p>
                {title ? <p className="truncate font-serif text-lg leading-tight tracking-tight">{title}</p> : null}
              </div>
              {hint ? <span className="text-label text-muted-foreground tabular-nums">{hint}</span> : null}
              <IconButton type="button" aria-label="Close preview" icon={X} onClick={() => onOpenChange(false)} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="mx-auto w-full max-w-[22rem] rounded-[1.7rem] border border-border/60 bg-background p-2.5 shadow-inner">
                <div className="mb-2 flex justify-center">
                  <span className="h-1.5 w-16 rounded-full bg-foreground/12" />
                </div>
                <div className="overflow-hidden rounded-[1.25rem] bg-card px-1 pb-1">{children}</div>
              </div>
            </div>
            {footer ? <div className="border-t border-border/50 p-3">{footer}</div> : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? null : (
          <motion.button
            key="studio-preview-dock"
            type="button"
            aria-expanded={false}
            aria-controls={panelId}
            onClick={() => onOpenChange(true)}
            className="fixed z-30 flex max-w-[min(16.5rem,calc(100vw-1.5rem))] items-center gap-2.5 rounded-2xl border border-border/70 bg-card/90 p-1.5 pr-3 text-left shadow-overlay backdrop-blur-md transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-floating"
            style={{
              right: "calc(var(--cw-frame-right) + 0.85rem)",
              bottom: "calc(var(--cw-frame-bottom) + 5.75rem)",
            }}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-primary">
                  <Icon icon={Smartphone} size="sm" lottie={false} />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-label font-medium tracking-eyebrow text-primary/90 uppercase">
                <PulseDot className="h-2 w-2" />
                {label}
              </span>
              <span className="mt-0.5 block truncate font-serif text-base leading-tight tracking-tight">
                {title || "See how couples see you"}
              </span>
              <span className="mt-0.5 block text-label text-muted-foreground">
                {hint ? `${hint} · Open` : "Open listing preview"}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
