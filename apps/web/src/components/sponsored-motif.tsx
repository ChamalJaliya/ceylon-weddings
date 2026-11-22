"use client";

/** Lightweight SVG motif for sponsored cards — plays once on mount, respects reduced motion. */
export function SponsoredMotif({
  kind = "petals",
  className,
}: {
  kind?: "petals" | "cork" | "polaroid" | "lights";
  className?: string;
}) {
  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 80 80" className="size-full overflow-visible">
        {kind === "petals" ? (
          <g className="origin-center motion-safe:animate-[spin_4s_ease-out_1]">
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <ellipse
                key={deg}
                cx="40"
                cy="22"
                rx="7"
                ry="14"
                fill="currentColor"
                opacity="0.35"
                transform={`rotate(${deg} 40 40)`}
              />
            ))}
            <circle cx="40" cy="40" r="6" fill="currentColor" opacity="0.55" />
          </g>
        ) : null}
        {kind === "cork" ? (
          <g className="motion-safe:animate-[bounce_1.2s_ease-out_1]">
            <rect x="34" y="28" width="12" height="28" rx="3" fill="currentColor" opacity="0.4" />
            <circle cx="40" cy="24" r="8" fill="currentColor" opacity="0.55" />
          </g>
        ) : null}
        {kind === "polaroid" ? (
          <g className="origin-center motion-safe:animate-[pulse_2s_ease-out_1]">
            <rect x="18" y="16" width="36" height="44" rx="2" fill="currentColor" opacity="0.25" />
            <rect x="26" y="22" width="36" height="44" rx="2" fill="currentColor" opacity="0.45" />
          </g>
        ) : null}
        {kind === "lights" ? (
          <g>
            {[16, 32, 48, 64].map((x, i) => (
              <circle
                key={x}
                cx={x}
                cy="40"
                r="5"
                fill="currentColor"
                opacity={0.25 + i * 0.15}
                className="motion-safe:animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </g>
        ) : null}
      </svg>
    </div>
  );
}
