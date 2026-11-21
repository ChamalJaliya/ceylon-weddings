"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { WEDDING_IMAGES } from "@/lib/wedding-images";

/** <img> that swaps to a curated wedding photo when the source is missing or fails to load. */
export function SafeImg({
  src,
  fallbackIndex = 0,
  alt = "",
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | null; fallbackIndex?: number }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Server-rendered images can fail before React attaches onError — check once on mount.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);
  const fallback = (WEDDING_IMAGES[fallbackIndex % WEDDING_IMAGES.length] ?? WEDDING_IMAGES[0]).replace(
    "w=2000",
    "w=1200",
  );
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} {...props} alt={alt} src={!src || failed ? fallback : src} onError={() => setFailed(true)} />;
}
