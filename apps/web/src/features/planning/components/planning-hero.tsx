import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@ceylonweddings/ui/utils";

/** Dark emerald → ink hero banner shared by the planning pages. */
export function PlanningHero({
  icon: Icon,
  kicker,
  title,
  description,
  actions,
  children,
  className,
}: {
  icon: LucideIcon;
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-3xl p-6 text-paper shadow-raised sm:p-8 print:rounded-none print:bg-none print:p-0 print:text-foreground print:shadow-none",
        className,
      )}
      style={{
        background:
          "radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--color-primary) 75%, transparent) 0%, transparent 60%)," +
          "radial-gradient(60% 70% at 100% 120%, color-mix(in srgb, var(--cw-gold-300) 18%, transparent) 0%, transparent 60%)," +
          "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 35%, var(--color-ink)) 0%, var(--color-ink) 70%)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid max-w-2xl gap-3">
          <p className="flex items-center gap-2 text-label tracking-eyebrow text-paper/60 uppercase print:text-muted-foreground">
            <Icon className="size-3.5" /> {kicker}
          </p>
          <h1 className="font-serif text-4xl leading-none font-medium tracking-tight sm:text-5xl">{title}</h1>
          {description ? <p className="text-paper/70 print:text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2 print:hidden",
              // Buttons dropped into the hero adapt to the dark surface automatically.
              "[&_[data-slot=button]]:rounded-full",
              "[&_[data-slot=button][data-variant=default]]:bg-paper [&_[data-slot=button][data-variant=default]]:text-ink [&_[data-slot=button][data-variant=default]:hover]:bg-paper/90",
              "[&_[data-slot=button][data-variant=outline]]:border-paper/30 [&_[data-slot=button][data-variant=outline]]:bg-transparent [&_[data-slot=button][data-variant=outline]]:text-paper [&_[data-slot=button][data-variant=outline]:hover]:bg-paper/10",
              "[&_[data-slot=button][data-variant=secondary]]:border-paper/30 [&_[data-slot=button][data-variant=secondary]]:bg-paper/10 [&_[data-slot=button][data-variant=secondary]]:text-paper",
              "[&_[data-slot=button][data-variant=ghost]]:text-paper/80 [&_[data-slot=button][data-variant=ghost]:hover]:bg-paper/10 [&_[data-slot=button][data-variant=ghost]:hover]:text-paper",
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

export const heroButtonClass = "gap-2 border-paper/30 bg-transparent text-paper hover:bg-paper/10 hover:text-paper";
export const heroSelectClass = "border-paper/20 bg-paper/10 text-paper [&_svg]:text-paper/70";
