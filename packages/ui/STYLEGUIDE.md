# Ceylon Weddings style guide

One change in `src/styles/tokens.css` re-themes the whole site. Pages do not own colours, type sizes, weights, or radii.

`pnpm lint` runs `scripts/check-design-system.mjs`, which fails CI on any rule below.

## Token tiers

1. **Primitives** (`--cw-gold-600`, `--cw-maroon-700`, `--cw-night-950` …) in `styles/tokens.css` are the only hex values in the codebase. They are the brand palette.
2. **Semantic tokens** (`--color-primary`, `--color-text-muted`, `--color-bg-card`, `--color-success-subtle`) point at primitives with `var()`. `.temple` and `.night` only reassign these — they never add a hex.
3. **Component tokens** (`--button-radius`, `--field-height`, `--modal-padding`, `--shadow-dock`) point at semantic tokens or the scales.
4. **Theme bridge** in `styles/theme.css` maps shadcn names (`--primary`, `--muted-foreground`) and Tailwind `@theme inline` utilities onto those variables, so utilities follow the theme at runtime.

## Themes

| Theme | Class | Feel |
| --- | --- | --- |
| Pearl (default) | `:root` | Ivory paper, champagne gold, peacock-jade focus |
| Temple | `.temple` | Sandalwood, kumkum maroon, gold accents |
| Night | `.night` | Warm ink, cream text, gold leaf |

`next-themes` sets the class (see `packages/web/src/providers/app-providers.tsx`). Add a theme override by reassigning a semantic variable inside the theme block in `tokens.css`.

Studio tokens (`studio-ink`, `studio-paper`, `studio-accent` …) are the moodboard canvas chrome and stay the same in every theme. `paper` and `ink` are fixed light/dark for copy and scrims over photography.

## File order

`styles/index.css`: tokens → density → theme → base → layout → components → utilities. `styles/globals.css` imports Tailwind, tw-animate, and that index. `apps/web/src/app/globals.css` imports `@ceylonweddings/ui/globals.css` and declares no colours.

## What a page may use

- Layout utilities: `flex`, `grid`, `gap-*`, `p-*`, `m-*`, widths, heights.
- Semantic colours: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `text-body-foreground`, `bg-primary`, `text-primary`, `border-border`, `bg-success-subtle`, `text-warning-fg`, `bg-status-danger-bg`, `from-chart-1/20`, `text-love`, `bg-premium-subtle`, `text-hero-foreground`, `bg-ink/60`, `text-paper`.
- Type: `text-display`, `text-h1` … `text-h4`, `text-body-lg`, `text-body`, `text-compact`, `text-caption`, `text-label`; `font-serif` (Cormorant), `font-sans` (Geist), `font-mood`, `font-script`, `font-mono`; `font-normal` / `font-medium`.
- Tracking: `tracking-label`, `tracking-spaced`, `tracking-eyebrow`, `tracking-ornate`. Eyebrows: `.cw-eyebrow`.
- Elevation: `shadow-sm` (rest), `shadow-card`, `shadow-md` (raised), `shadow-lg` (overlay), `shadow-xl` (floating), `shadow-dock`, `shadow-focus`, `shadow-field`.
- Shared components: `Button`, `Card`, `Badge`, `Input`, `Textarea`, `NativeSelect`, `Dialog`, `Heading`.

## What a page may not use (CI fails)

| Rule | Example | Use instead |
| --- | --- | --- |
| Raw palette | `bg-amber-500/15`, `text-emerald-600` | `bg-warning/15`, `text-success-fg` |
| White / black | `text-white`, `from-black/70` | `text-paper`, `from-ink/70` |
| Heavy weight | `font-semibold`, `font-bold` | `font-medium` |
| Arbitrary size | `text-[11px]` | `text-label` |
| Arbitrary tracking | `tracking-[0.2em]` | `tracking-eyebrow` |
| Arbitrary colour | `bg-[#fffaf5]`, `shadow-[0_8px_rgba(0,0,0,.1)]` | `bg-studio-paper`, `shadow-raised` |
| Density breakpoint | `max-[1400px]:hidden` | `compact:hidden` |
| Hex in TS | `"#b4532a"` | token, or `readCssToken()` for canvas |
| Stylesheet colour | `color: #333`, `rgba()`, `oklch()` | `var(--color-*)`, `color-mix(in srgb, var(--…) n%, transparent)` |

Weights 600 and 700 are also mapped to 500 in the theme, so a stray `font-bold` from a dependency stays on-brand.

## How to add a colour

1. Add a primitive to `tokens.css` if the palette needs a new hex.
2. Point a semantic token at it with `var()` (and reassign in `.temple` / `.night` if it should differ).
3. If pages need a utility, map it in `theme.css` under `@theme inline`.
4. Use the utility. Never write the hex again.

## How to add a component style

1. Create `styles/components/my-block.css` with one BEM block in `@layer components`: `.block`, `.block__element`, `.block--modifier`.
2. Use semantic and component tokens only. No hex, no raw colour functions, no weight above 500, no `!important`.
3. Import it from `styles/index.css`.
4. Point the `cva` map in `src/contracts/*.ts` at the BEM classes. Layout utilities stay in the component; CVA picks the class; the CSS file owns the look. Utilities passed via `className` still override (components layer < utilities layer).

## Density

`DENSITY_MEDIA_QUERIES` in `src/lib/responsive-tiers.ts` owns the viewport tiers; `styles/density.css` holds every token override for them; `globals.css` exposes `compact:` / `dense:` variants. The guard checks all three use the same strings.

| Tier | When | Device |
| --- | --- | --- |
| comfortable | default | MacBook, large monitor |
| compact | ≤1400px wide, low-DPI below 1700px, or ≤720px tall | Windows at 125–150% |
| dense | ≥640px wide and ≤720px tall | 1366×768 at 100% |
| phone | <640px | phones |

Density tiers resize type and control heights only. Unlike Kloqra we keep Tailwind `--spacing` fixed — the photography-led public site needs its breathing room.

## Canvas and native inputs

`<canvas>` (Konva moodboard, confetti) can't read CSS variables. Read the token at runtime with `readCssToken()` / `readCssTokens()` from `@ceylonweddings/ui/tokens`. Only read tokens that resolve to a plain primitive.

## Exceptions (marked `design-system:` in code)

- `styles/tokens.css` holds the raw values.
- **User data**: colours saved onto records — wedding style palettes (`packages/contracts/src/wedding/style-palettes.ts`), appointment kind defaults, moodboard swatches (`apps/web/src/components/moodboard/palette.ts`), promotion accent defaults.
- **Brand marks**: third-party logos with their official fills (Google sign-in).
