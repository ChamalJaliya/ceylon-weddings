"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { motion, useScroll, useSpring } from "@ceylonweddings/ui/domain/motion";

/** Thin bar under the site header that fills as you read. */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-primary via-love to-primary"
    />
  );
}

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(window.location.href).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        });
      }}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm transition hover:border-primary/40 hover:text-primary"
    >
      {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />}
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
