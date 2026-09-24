import { Badge } from "../components/badge";

export function TrustMarks({
  verified,
  featured,
  destination,
}: {
  verified?: boolean;
  featured?: boolean;
  destination?: boolean;
}) {
  if (!verified && !featured && !destination) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {verified ? <Badge intent="success">Verified</Badge> : null}
      {featured ? <Badge intent="love">Featured</Badge> : null}
      {destination ? <Badge intent="info">Destination</Badge> : null}
    </div>
  );
}
