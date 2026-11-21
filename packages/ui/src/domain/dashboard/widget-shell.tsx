"use client";

import { forwardRef, useMemo, type CSSProperties, type ReactNode } from "react";
import { Info, Lightbulb, X } from "lucide-react";
import { Icon, type IconComponent } from "../../components/icon";
import { Tooltip } from "../../components/tooltip";
import { cn } from "../../lib/utils";

/** Info icon that reveals a widget's description on hover or keyboard focus. */
export function WidgetInfoTooltip({ label, description }: { label: string; description: string }) {
  const content = useMemo(
    () => <span className="block max-w-64 text-caption leading-snug">{description}</span>,
    [description],
  );
  return (
    <Tooltip content={content} side="bottom">
      <button
        type="button"
        aria-label={`About ${label}: ${description}`}
        className="widget-no-drag inline-grid size-4 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon icon={Info} size="xs" lottie={false} />
      </button>
    </Tooltip>
  );
}

export type WidgetShellProps = {
  label: string;
  description?: string;
  icon?: IconComponent;
  isEditing: boolean;
  /** Bare: no outer surface (KPI tiles bring their own card). Title is hidden too. */
  bare?: boolean;
  emphasis?: "filled" | "outline";
  /** Controls in the title row (filters, "View all" links). Not clickable while arranging. */
  headerActions?: ReactNode;
  /** Hover chrome: highlight + remove. */
  chromeActions?: ReactNode;
  /** Drop the body padding (media, full-bleed lists). */
  flush?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Card every dashboard widget lives in (Kloqra WidgetShell): serif title with an
 * info tooltip, header actions, hover chrome for highlight/remove, and an edit
 * state where the whole card is a drag handle.
 */
export const WidgetShell = forwardRef<HTMLDivElement, WidgetShellProps>(function WidgetShell(
  {
    label,
    description,
    icon,
    isEditing,
    bare = false,
    emphasis = "filled",
    headerActions,
    chromeActions,
    flush = false,
    className,
    style,
    children,
  },
  ref,
) {
  const showHeader = !bare;
  return (
    <section
      ref={ref}
      style={style}
      aria-label={label}
      data-slot="widget"
      data-emphasis={emphasis}
      className={cn(
        "widget",
        bare && "widget--bare",
        emphasis === "outline" && !bare && "widget--outline",
        isEditing ? "widget--editing" : "widget--stagger",
        className,
      )}
    >
      {chromeActions && (bare || !showHeader) ? (
        <div className="widget-no-drag widget__chrome widget__chrome--floating">{chromeActions}</div>
      ) : null}
      {showHeader ? (
        <header className="widget__header">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {icon ? (
              <span className="widget__icon" aria-hidden>
                <Icon icon={icon} size="xs" lottie={false} />
              </span>
            ) : null}
            <h3 className="widget__title" title={label}>
              {label}
            </h3>
            {description ? <WidgetInfoTooltip label={label} description={description} /> : null}
          </div>
          {headerActions || chromeActions ? (
            <div className="widget-no-drag ml-auto flex shrink-0 items-center gap-1.5">
              {!isEditing ? headerActions : null}
              {chromeActions ? <div className="widget__chrome">{chromeActions}</div> : null}
            </div>
          ) : null}
        </header>
      ) : null}
      <div className={cn("widget__body", (bare || flush) && "widget__body--flush")}>{children}</div>
    </section>
  );
});

export type WidgetChromeActionsProps = {
  label: string;
  emphasis: "filled" | "outline";
  onToggleEmphasis: () => void;
  onRemove: () => void;
};

/** Per-widget highlight (filled ↔ outline) and remove buttons. */
export function WidgetChromeActions({ label, emphasis, onToggleEmphasis, onRemove }: WidgetChromeActionsProps) {
  const filled = emphasis !== "outline";
  const stop = (event: { stopPropagation: () => void }) => event.stopPropagation();
  return (
    <>
      <button
        type="button"
        className="widget__chrome-button"
        aria-pressed={filled}
        aria-label={filled ? `Use outline highlight for ${label}` : `Use filled highlight for ${label}`}
        title={filled ? "Highlight: filled (click for outline)" : "Highlight: outline (click for filled)"}
        onMouseDown={stop}
        onPointerDown={stop}
        onClick={(event) => {
          stop(event);
          onToggleEmphasis();
        }}
      >
        <Lightbulb className="size-3.5" strokeWidth={1.75} aria-hidden fill={filled ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        className="widget__chrome-button widget__chrome-button--danger"
        aria-label={`Remove ${label} from dashboard`}
        title={`Remove ${label}`}
        onMouseDown={stop}
        onPointerDown={stop}
        onClick={(event) => {
          stop(event);
          onRemove();
        }}
      >
        <X className="size-3.5" strokeWidth={1.75} aria-hidden />
      </button>
    </>
  );
}
