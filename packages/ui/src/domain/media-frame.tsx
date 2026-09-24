import { cn } from "../lib/utils";

export function MediaFrame({
  src,
  alt = "",
  className,
  aspect = "aspect-[4/3]",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-secondary", aspect, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}
