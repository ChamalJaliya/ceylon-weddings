import { Badge } from "../components/badge";
import { cn } from "../lib/utils";

export type PackageCompareItem = {
  id: string;
  name: string;
  priceLabel: string;
  description?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  addOns?: string[];
  badge?: string | null;
  bestFor?: string | null;
  selected?: boolean;
};

export function PackageCompare({
  packages,
  onSelect,
  className,
}: {
  packages: PackageCompareItem[];
  onSelect?: (id: string) => void;
  className?: string;
}) {
  if (!packages.length) {
    return <p className="text-sm text-muted-foreground">No packages published yet.</p>;
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-3", className)}>
      {packages.map((pkg) => (
        <button
          key={pkg.id}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(pkg.id)}
          className={cn(
            "grid gap-2.5 rounded-2xl border border-border/80 bg-card/80 p-4 text-left transition duration-300",
            pkg.selected ? "border-primary ring-1 ring-primary" : "hover:border-primary/40",
            !onSelect && "cursor-default",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="grid gap-0.5">
              <h3 className="font-serif text-lg leading-tight tracking-tight md:text-xl">{pkg.name}</h3>
              {pkg.bestFor ? <p className="text-xs text-muted-foreground">{pkg.bestFor}</p> : null}
            </div>
            {pkg.badge ? <Badge intent="love">{pkg.badge.replaceAll("_", " ")}</Badge> : null}
          </div>
          <p className="text-base font-medium text-primary md:text-lg">{pkg.priceLabel}</p>
          {pkg.description ? <p className="text-sm leading-relaxed text-muted-foreground">{pkg.description}</p> : null}
          {(pkg.inclusions ?? []).length ? (
            <ul className="grid gap-1 text-sm">
              {pkg.inclusions!.slice(0, 6).map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
          ) : null}
          {(pkg.exclusions ?? []).length ? (
            <ul className="grid gap-1 text-xs text-muted-foreground">
              {pkg.exclusions!.slice(0, 4).map((item) => (
                <li key={item}>✕ {item}</li>
              ))}
            </ul>
          ) : null}
          {(pkg.addOns ?? []).length ? (
            <div className="grid gap-1 border-t border-border pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Add-ons</p>
              <ul className="grid gap-1 text-xs text-muted-foreground">
                {pkg.addOns!.slice(0, 4).map((item) => (
                  <li key={item}>+ {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}
