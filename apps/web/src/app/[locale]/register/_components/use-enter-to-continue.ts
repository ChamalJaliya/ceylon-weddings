"use client";

import { useEffect, useRef } from "react";

/**
 * Press Enter anywhere in a wizard step to continue — unless focus is in a
 * textarea, a button/link (Enter already activates those), or an open
 * combobox/listbox where Enter picks an option.
 */
export function useEnterToContinue(enabled: boolean, onContinue: () => void) {
  const latest = useRef(onContinue);
  latest.current = onContinue;

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.isComposing || event.shiftKey || event.defaultPrevented) return;
      const el = event.target as HTMLElement | null;
      if (el?.closest("textarea, button, a, [role=combobox], [role=listbox], [role=option], [contenteditable=true]")) {
        return;
      }
      event.preventDefault();
      latest.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
