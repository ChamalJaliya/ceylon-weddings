"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { GripHorizontal } from "lucide-react";
import { cn } from "@ceylonweddings/ui/utils";

const STORAGE_KEY = "cw-moodboard-tool-rail";
const DEFAULT_POS = { x: 12, y: 12 };

type Pos = { x: number; y: number };

function clamp(pos: Pos, el: HTMLElement): Pos {
  const parent = el.offsetParent as HTMLElement | null;
  const maxX = Math.max(8, (parent?.clientWidth ?? 400) - el.offsetWidth - 8);
  const maxY = Math.max(8, (parent?.clientHeight ?? 400) - el.offsetHeight - 8);
  return {
    x: Math.min(maxX, Math.max(8, pos.x)),
    y: Math.min(maxY, Math.max(8, pos.y)),
  };
}

export function MoodboardToolRail({ children }: { children: ReactNode }) {
  const railRef = useRef<HTMLElement>(null);
  const drag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);
  const [pos, setPos] = useState<Pos>(DEFAULT_POS);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Pos;
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        setPos(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: Pos) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { ox: pos.x, oy: pos.y, sx: e.clientX, sy: e.clientY };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const next = {
      x: drag.current.ox + e.clientX - drag.current.sx,
      y: drag.current.oy + e.clientY - drag.current.sy,
    };
    const el = railRef.current;
    setPos(el ? clamp(next, el) : next);
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    const el = railRef.current;
    setPos((current) => {
      const next = el ? clamp(current, el) : current;
      persist(next);
      return next;
    });
  };

  return (
    <aside
      ref={railRef}
      className={cn(
        "absolute z-40 flex w-[3.25rem] flex-col items-center gap-2 rounded-2xl border border-white/10 bg-[#17130f]/95 py-2 shadow-xl backdrop-blur-sm",
        dragging && "cursor-grabbing",
      )}
      style={{ left: pos.x, top: pos.y }}
    >
      <button
        type="button"
        aria-label="Move toolbar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex h-5 w-8 cursor-grab items-center justify-center rounded-md text-[#fffaf5]/40 hover:bg-white/10 hover:text-[#fffaf5]/80 active:cursor-grabbing"
      >
        <GripHorizontal className="size-3.5" />
      </button>
      {children}
    </aside>
  );
}
