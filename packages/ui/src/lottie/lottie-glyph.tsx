"use client";

import { useEffect, useRef } from "react";
import { Lottie, type LottieHandle } from "lottie-react";
import { cn } from "../lib/utils";
import type { LottieAnimationData } from "./registry";

/**
 * Monochrome Lottie glyph: frozen on first frame, loops while hovered
 * (self or nearest `.group` ancestor). Pass `playing` to keep looping
 * (e.g. selected category chips).
 */
export function LottieGlyph({
  data,
  size,
  className,
  playOnHover = true,
  playing = false,
}: {
  data: LottieAnimationData;
  size: number;
  className?: string;
  playOnHover?: boolean;
  /** Keep the loop running (selected / active state). */
  playing?: boolean;
}) {
  const lottieRef = useRef<LottieHandle>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const handle = lottieRef.current;
    if (!handle) return;
    if (playing) handle.play();
    else handle.stop();
  }, [data, playing]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !playOnHover) return;

    const target = (el.closest(".group") as HTMLElement | null) ?? el;

    const play = () => {
      lottieRef.current?.play();
    };

    const reset = () => {
      if (playingRef.current) return;
      lottieRef.current?.stop();
    };

    target.addEventListener("pointerenter", play);
    target.addEventListener("pointerleave", reset);
    target.addEventListener("focusin", play);
    target.addEventListener("focusout", reset);

    return () => {
      target.removeEventListener("pointerenter", play);
      target.removeEventListener("pointerleave", reset);
      target.removeEventListener("focusin", play);
      target.removeEventListener("focusout", reset);
    };
  }, [playOnHover, data]);

  return (
    <span
      ref={wrapRef}
      data-icon=""
      data-slot="lottie-icon"
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center cw-lottie-mono", className)}
      style={{ width: size, height: size }}
    >
      <Lottie
        as="span"
        lottieRef={lottieRef}
        src={data}
        autoplay={playing}
        loop
        speed={0.45}
        className="block size-full"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
