import * as React from "react";
import { cn } from "../lib/utils";
import { cardVariants, type CardElevation } from "../contracts/card";

export function Card({
  className,
  elevation = "raised",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { elevation?: CardElevation }) {
  return (
    <div data-slot="card" className={cn(cardVariants({ elevation }), className)} {...props} />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 p-6 has-[[data-slot=card-action]]:flex-row has-[[data-slot=card-action]]:items-center has-[[data-slot=card-action]]:justify-between",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      data-slot="card-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardMedia({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div data-slot="card-media" className={cn("aspect-[4/3] overflow-hidden rounded-t-xl", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="size-full object-cover" />
    </div>
  );
}
