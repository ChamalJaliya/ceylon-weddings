import { TrustMarks } from "./trust-marks";

export function VendorIdentity({
  name,
  category,
  location,
  verified,
  featured,
  destination,
  kicker,
}: {
  name: string;
  category?: string;
  location?: string;
  verified?: boolean;
  featured?: boolean;
  destination?: boolean;
  kicker?: string;
}) {
  return (
    <div className="grid gap-2">
      {kicker || category ? (
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{kicker ?? category}</p>
      ) : null}
      <h1 className="font-serif text-3xl tracking-tight md:text-4xl">{name}</h1>
      {location ? <p className="text-sm text-muted-foreground">{location}</p> : null}
      <TrustMarks verified={verified} featured={featured} destination={destination} />
    </div>
  );
}
