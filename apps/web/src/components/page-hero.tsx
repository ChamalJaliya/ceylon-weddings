"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { WEDDING_IMAGES } from "@/lib/wedding-images";

/** Photo banner used at the top of marketing pages (catalog, how it works, awards, contact, consultation). */
export function PageHero({
  eyebrow,
  title,
  sub,
  image = 0,
  imageSrc,
  icon,
  children,
  className,
  align = "left",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  image?: number;
  imageSrc?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const fallback = WEDDING_IMAGES[image % WEDDING_IMAGES.length] ?? WEDDING_IMAGES[0];
  const src = imageSrc && !failed ? imageSrc : fallback;

  return (
    <section className={cn("mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6", className)}>
      <div className="relative isolate overflow-hidden rounded-3xl bg-ink">
        <AnimatePresence initial={false}>
          <motion.img
            key={src}
            src={src}
            alt=""
            aria-hidden
            onError={() => setFailed(true)}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 -z-10 size-full object-cover"
          />
        </AnimatePresence>
        <div
          className={cn(
            "absolute inset-0 -z-10",
            align === "center"
              ? "bg-gradient-to-t from-ink/85 via-ink/55 to-ink/35"
              : "bg-gradient-to-r from-ink/85 via-ink/55 to-ink/20",
          )}
        />
        <motion.div
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
          className={cn(
            "flex min-h-80 flex-col justify-end gap-4 px-6 py-10 text-paper sm:min-h-96 sm:px-12 sm:py-14",
            align === "center" && "items-center text-center",
          )}
        >
          {icon ? (
            <motion.span
              variants={{ hidden: { opacity: 0, scale: 0.6, rotate: -12 }, show: { opacity: 1, scale: 1, rotate: 0 } }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="grid size-12 place-items-center rounded-2xl bg-paper/15 text-paper ring-1 ring-paper/25 backdrop-blur-md"
            >
              {icon}
            </motion.span>
          ) : null}
          {eyebrow ? (
            <motion.p
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="text-label font-medium tracking-eyebrow text-paper/70 uppercase"
            >
              {eyebrow}
            </motion.p>
          ) : null}
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
              show: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl font-serif text-4xl leading-tight font-medium tracking-tight text-balance sm:text-6xl"
          >
            {title}
          </motion.h1>
          {sub ? (
            <motion.p
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="max-w-xl text-sm leading-relaxed text-paper/80 sm:text-h4"
            >
              {sub}
            </motion.p>
          ) : null}
          {children ? (
            <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="mt-2">
              {children}
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
