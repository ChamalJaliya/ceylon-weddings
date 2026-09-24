import { Badge } from "../components/badge";
import type { BadgeIntent } from "../contracts/badge";
import { MediaFrame } from "./media-frame";
import { cn } from "../lib/utils";

const STATUS_INTENT: Record<string, BadgeIntent> = {
  SHORTLISTED: "info",
  INQUIRED: "love",
  BOOKED: "success",
};

export function TeamMemberCard({
  name,
  category,
  location,
  photoUrl,
  status,
  className,
}: {
  name: string;
  category: string;
  location?: string;
  photoUrl?: string | null;
  status: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 overflow-hidden rounded-3xl border border-border bg-card p-3", className)}>
      <MediaFrame src={photoUrl} alt={name} aspect="aspect-[5/4]" />
      <div className="grid gap-1 px-1 pb-1">
        <p className="truncate font-serif text-lg">{name}</p>
        <p className="text-xs text-muted-foreground">
          {category}
          {location ? ` · ${location}` : ""}
        </p>
        <Badge intent={STATUS_INTENT[status] ?? "info"}>{status}</Badge>
      </div>
    </div>
  );
}

export function SupplierStrip({
  items,
}: {
  items: Array<{
    id: string;
    name: string;
    category: string;
    photoUrl?: string | null;
    href?: string;
    status?: string;
  }>;
}) {
  if (!items.length) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map((item) => {
        const body = (
          <>
            <MediaFrame src={item.photoUrl} alt={item.name} aspect="aspect-square" className="rounded-none" />
            <div className="grid gap-0.5 p-2">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{item.category}</p>
              {item.status ? (
                <Badge intent={STATUS_INTENT[item.status] ?? "info"} className="mt-1 w-fit">
                  {item.status}
                </Badge>
              ) : null}
            </div>
          </>
        );
        return (
          <div key={item.id} className="w-36 shrink-0 overflow-hidden rounded-2xl border border-border bg-card">
            {item.href ? (
              <a href={item.href} className="block">
                {body}
              </a>
            ) : (
              body
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GuestVendorCredit({
  name,
  category,
  photoUrl,
  href,
}: {
  name: string;
  category: string;
  photoUrl?: string | null;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <MediaFrame src={photoUrl} alt={name} aspect="aspect-square" className="size-14 shrink-0 rounded-full" />
      <div className="min-w-0">
        <p className="truncate font-serif text-lg">{name}</p>
        <p className="text-xs text-muted-foreground">{category}</p>
        {href ? (
          <a href={href} className="text-xs text-primary underline-offset-2 hover:underline">
            View on CeylonWeddings
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function AdminListingPreview({
  name,
  category,
  location,
  photoUrl,
  photos,
  verified,
  featured,
  ready,
}: {
  name: string;
  category: string;
  location: string;
  photoUrl?: string | null;
  photos?: string[] | null;
  verified?: boolean;
  featured?: boolean;
  ready?: boolean;
}) {
  const strip = (photos?.filter(Boolean).length ? photos : photoUrl ? [photoUrl] : []).slice(0, 3) as string[];
  return (
    <div className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-card p-2">
      <div className="grid h-16 w-28 grid-cols-3 gap-0.5 overflow-hidden rounded-xl">
        {strip.length ? (
          strip.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${src}-${index}`} src={src} alt="" className="h-full w-full object-cover" />
          ))
        ) : (
          <div className="col-span-3 bg-secondary" />
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {category} · {location}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {verified ? "Verified · " : ""}
          {featured ? "Featured · " : ""}
          {ready ? "Presentation ready" : "Needs polish"}
        </p>
      </div>
    </div>
  );
}
