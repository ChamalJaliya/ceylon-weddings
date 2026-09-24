"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronDown, Smartphone, X } from "lucide-react";
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
        <label
          htmlFor={htmlFor}
          className={fieldLabel}
        >
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

export function StickyActionBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="sticky-action-bar"
      className={cn(
        "sticky bottom-0 z-20 mt-2 flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-card/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CreatorSectionNav({
  sections,
  active,
  onSelect,
}: {
  sections: Array<{ id: string; label: string; done?: boolean }>;
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="sticky top-24 grid gap-1.5 rounded-2xl border border-border/50 bg-card/40 p-2">
      {sections.map((section, index) => {
        const isActive = active === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition duration-200",
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
                "relative z-10 grid size-6 place-items-center rounded-full text-[11px] font-medium",
                isActive ? "bg-primary-foreground/15 text-primary-foreground" : "bg-secondary text-foreground/70",
              )}
            >
              {section.done ? "✓" : index + 1}
            </span>
            <span className="relative z-10 font-medium tracking-tight">{section.label}</span>
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
          {values.map((value) => (
            <button
              key={value}
              type="button"
              className="rounded-full border border-border/60 bg-secondary/80 px-3 py-1 text-xs transition hover:border-destructive/40 hover:text-destructive"
              onClick={() => onChange(values.filter((item) => item !== value))}
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
  children,
}: {
  nav: ReactNode;
  preview?: ReactNode;
  previewLabel?: string;
  previewTitle?: string;
  previewHint?: string;
  previewThumb?: string | null;
  previewFooter?: ReactNode;
  children: ReactNode | ((preview: StudioPreviewControls) => ReactNode);
}) {
  const [open, setOpen] = useState(false);
  const controls: StudioPreviewControls = {
    open,
    setOpen,
    toggle: () => setOpen((value) => !value),
  };
  const body = typeof children === "function" ? children(controls) : children;

  return (
    <div className="relative grid gap-8 xl:grid-cols-[13rem_minmax(0,1fr)] xl:items-start">
      <aside className="hidden xl:block">{nav}</aside>
      <div className={cn("min-w-0 grid gap-6 transition-[padding] duration-300 ease-out motion-reduce:transition-none", open && "xl:pr-[min(27rem,42vw)]")}>{body}</div>
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
            className="fixed z-40 flex w-[min(26rem,calc(100vw-1.25rem))] flex-col overflow-hidden rounded-[1.85rem] border border-border/70 bg-card/95 shadow-[0_24px_80px_rgba(40,24,12,0.18)] backdrop-blur-xl"
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
                <p className="text-[11px] font-medium tracking-[0.2em] text-primary/90 uppercase">{label}</p>
                {title ? <p className="truncate font-serif text-lg leading-tight tracking-tight">{title}</p> : null}
              </div>
              {hint ? <span className="text-[11px] text-muted-foreground tabular-nums">{hint}</span> : null}
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
            className="fixed z-30 flex max-w-[min(16.5rem,calc(100vw-1.5rem))] items-center gap-2.5 rounded-2xl border border-border/70 bg-card/90 p-1.5 pr-3 text-left shadow-[0_16px_50px_rgba(40,24,12,0.16)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_56px_rgba(40,24,12,0.2)]"
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
              <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.18em] text-primary/90 uppercase">
                <PulseDot className="h-2 w-2" />
                {label}
              </span>
              <span className="mt-0.5 block truncate font-serif text-base leading-tight tracking-tight">
                {title || "See how couples see you"}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {hint ? `${hint} · Open` : "Open listing preview"}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
