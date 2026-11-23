export function formatLkr(lkr: number): string {
  if (Math.abs(lkr) >= 1_000_000) return `Rs ${(lkr / 1_000_000).toFixed(1)}M`;
  if (Math.abs(lkr) >= 1_000) return `Rs ${Math.round(lkr / 1_000)}K`;
  return `Rs ${lkr.toLocaleString()}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Date TBC";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function titleCase(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
