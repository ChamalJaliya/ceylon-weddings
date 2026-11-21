import { cn } from "../lib/utils";

/**
 * Ceylon Wedding brand mark — a ring crowned by a Nil Manel (water lily)
 * with two sweeping leaves.
 *
 * Drawn with `currentColor`, so set the colour with a text-* class. The fine
 * separator strokes between petals/leaves must match whatever sits behind the
 * mark; pass `cutColor` (any CSS colour / var) when it is not the page
 * background — e.g. `var(--sidebar)` inside the app rail.
 *
 * Source artwork: apps/web/public/brand/ceylon-wedding-mark.svg
 */

const PETAL = "M0,0 C14,-16 15,-38 0,-58 C-15,-38 -14,-16 0,0Z";
const PETAL_SMALL = "M0,0 C11,-13 12,-31 0,-46 C-12,-31 -11,-13 0,0Z";

const PETALS: ReadonlyArray<readonly [d: string, transform: string]> = [
  [PETAL, "rotate(-62) scale(.82)"],
  [PETAL, "rotate(62) scale(.82)"],
  [PETAL, "rotate(-40) scale(.94)"],
  [PETAL, "rotate(40) scale(.94)"],
  [PETAL, "rotate(-18)"],
  [PETAL, "rotate(18)"],
  [PETAL, "scale(1.06)"],
  [PETAL_SMALL, "rotate(-30) scale(.95)"],
  [PETAL_SMALL, "rotate(30) scale(.95)"],
  [PETAL_SMALL, "rotate(-10) scale(.9)"],
  [PETAL_SMALL, "rotate(10) scale(.9)"],
];

export function BrandMark({
  className,
  cutColor = "var(--background)",
  title,
}: {
  className?: string;
  cutColor?: string;
  /** Accessible name. Omit when the mark sits next to visible brand text. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 220 250"
      fill="currentColor"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* Ring: offset circles → heavier at the bottom, fine at the top */}
      <path fillRule="evenodd" d="M110,98 a74,74 0 1,0 0.01,0Z M110,104 a66,69.5 0 1,0 0.01,0Z" />
      <g stroke={cutColor} strokeLinejoin="round">
        {/* Leaves sweeping along the ring */}
        <path strokeWidth={3} d="M108,108 C132,92 168,94 190,118 C164,112 136,114 108,108Z" />
        <path fill="none" strokeWidth={1.6} d="M114,107 C140,104 162,106 182,114" />
        <path strokeWidth={3} d="M112,108 C88,94 56,96 34,122 C58,114 86,115 112,108Z" />
        <path fill="none" strokeWidth={1.6} d="M106,107 C82,105 60,108 42,118" />
        {/* Water lily (Nil Manel) */}
        <g transform="translate(110,104)" strokeWidth={3}>
          {PETALS.map(([d, transform]) => (
            <path key={transform} d={d} transform={transform} />
          ))}
          <path d="M-22,-4 C-14,8 14,8 22,-4 C12,2 -12,2 -22,-4Z" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Horizontal lockup: mark + CEYLON / WEDDING / SRI LANKA ——.
 * Sized for the app rail; scale with the wrapper's font-size if needed.
 */
export function BrandLockup({
  className,
  cutColor,
  name = "Ceylon Wedding",
}: {
  className?: string;
  cutColor?: string;
  /** Accessible name for the whole lockup. */
  name?: string;
}) {
  return (
    <div role="img" aria-label={name} className={cn("flex items-center gap-3", className)}>
      <BrandMark cutColor={cutColor} className="h-12 w-auto text-primary" />
      <div aria-hidden className="min-w-0 leading-none text-foreground">
        <p className="font-serif text-xl tracking-ornate">CEYLON</p>
        <p className="mt-1.5 font-serif text-xs tracking-ornate">WEDDING</p>
        <p className="mt-1.5 flex items-center gap-2 text-label tracking-ornate text-muted-foreground">
          SRI LANKA
          <span className="h-px w-5 bg-current" />
        </p>
      </div>
    </div>
  );
}
