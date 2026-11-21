"use client";

/**
 * FloatingPanel — a floating side panel ported from Kloqra's Start Timer panel.
 *
 * A rounded, glassy card inset from the viewport edges (not a full-height
 * drawer), with an icon-tile header, a scrolling body and a pinned footer for
 * the primary action. Built on Radix Dialog, so focus trap, Escape-to-close,
 * scroll lock and aria wiring come for free.
 *
 *   <FloatingPanel open={open} onOpenChange={setOpen}>
 *     <FloatingPanelTrigger asChild><Button>Filters</Button></FloatingPanelTrigger>
 *     <FloatingPanelContent side="left">
 *       <FloatingPanelHeader icon={SlidersHorizontal} title="Filters" />
 *       <FloatingPanelBody>…fields…</FloatingPanelBody>
 *       <FloatingPanelFooter><Button className="w-full">Show results</Button></FloatingPanelFooter>
 *     </FloatingPanelContent>
 *   </FloatingPanel>
 */

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

export const FloatingPanel = DialogPrimitive.Root;
export const FloatingPanelTrigger = DialogPrimitive.Trigger;
export const FloatingPanelClose = DialogPrimitive.Close;

const sideClasses = {
  left: "left-[max(0.75rem,env(safe-area-inset-left))] data-[state=open]:slide-in-from-left-4 data-[state=closed]:slide-out-to-left-4",
  right:
    "right-[max(0.75rem,env(safe-area-inset-right))] data-[state=open]:slide-in-from-right-4 data-[state=closed]:slide-out-to-right-4",
} as const;

export const FloatingPanelContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: keyof typeof sideClasses;
    /** Panel width; capped to the viewport on phones. */
    width?: string;
  }
>(({ className, children, side = "right", width = "26rem", style, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[1px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "motion-reduce:animate-none",
      )}
    />
    <DialogPrimitive.Content
      ref={ref}
      style={{ width: `min(calc(100vw - 1.5rem), ${width})`, ...style }}
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-background/95 text-foreground outline-none",
        "shadow-floating ring-1 ring-foreground/[0.04] backdrop-blur-xl",
        "top-[max(0.75rem,env(safe-area-inset-top))] bottom-[max(0.75rem,env(safe-area-inset-bottom))]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-200",
        "motion-reduce:animate-none",
        sideClasses[side],
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
FloatingPanelContent.displayName = "FloatingPanelContent";

export function FloatingPanelHeader({
  icon: IconComponent,
  title,
  description,
  actions,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Extra controls before the close button (e.g. a "Reset" link). */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 border-b border-border/75 bg-background/90 px-4 py-3 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {IconComponent ? (
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background shadow-2xs ring-2 ring-primary/[0.06]">
            <IconComponent className="size-4 text-primary" strokeWidth={1.75} aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0">
          <DialogPrimitive.Title className="truncate text-sm font-medium leading-none">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 truncate text-xs text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {actions}
        <DialogPrimitive.Close
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden />
        </DialogPrimitive.Close>
      </div>
    </header>
  );
}

export function FloatingPanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-5", className)} {...props} />;
}

/** Titled group inside the body — small uppercase label + stacked fields. */
export function FloatingPanelSection({
  title,
  children,
  className,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-3", className)}>
      {title ? <p className="text-label font-medium tracking-spaced text-muted-foreground uppercase">{title}</p> : null}
      {children}
    </section>
  );
}

export function FloatingPanelFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "shrink-0 space-y-2 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
}
