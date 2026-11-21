"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Play, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/utils";
import { Icon } from "../components/icon";

export type VendorGalleryProject = {
  id: string;
  title: string;
  coverUrl?: string | null;
  items: Array<{ url: string }>;
};

export type VendorGalleryVideo = {
  id: string;
  url: string;
  title?: string | null;
};

function parseEmbed(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname
        .split("/")
        .filter(Boolean)
        .find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function youtubeThumb(raw: string): string | null {
  const embed = parseEmbed(raw);
  if (!embed?.includes("youtube.com/embed/")) return null;
  const id = embed.split("/embed/")[1]?.split("?")[0];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

const COLLAGE_GRID: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3 grid-rows-2",
  4: "grid-cols-4 grid-rows-2",
  5: "grid-cols-4 grid-rows-2",
};

const COLLAGE_TILE: Record<number, string[]> = {
  1: [""],
  2: ["", ""],
  3: ["col-span-2 row-span-2", "", ""],
  4: ["col-span-2 row-span-2", "col-span-2", "", ""],
  5: ["col-span-2 row-span-2", "", "", "", ""],
};

/** Round only the outer corners so the collage reads as one framed piece. */
function tileRadius(count: number, index: number) {
  if (count === 1) return "rounded-3xl";
  if (count === 2) return index === 0 ? "rounded-l-3xl rounded-r-md" : "rounded-r-3xl rounded-l-md";
  if (index === 0) return "rounded-l-3xl rounded-r-md";
  const topRight = count === 3 ? 1 : count === 4 ? 1 : 2;
  const bottomRight = count - 1;
  if (index === topRight) return "rounded-md rounded-tr-3xl";
  if (index === bottomRight) return "rounded-md rounded-br-3xl";
  return "rounded-md";
}

export function VendorGallery({
  photos,
  coverUrl,
  name,
  className,
  cinematic = "default",
  projects = [],
  introVideoUrl,
  videos = [],
  album,
}: {
  photos: string[];
  coverUrl?: string | null;
  name: string;
  className?: string;
  cinematic?: "default" | "venue" | "portrait" | "detail";
  projects?: VendorGalleryProject[];
  introVideoUrl?: string | null;
  videos?: VendorGalleryVideo[];
  /** Optional controlled album (e.g. a project picked from story cards elsewhere on the page). */
  album?: string;
}) {
  const albums = useMemo(() => {
    const gallery = photos.filter(Boolean);
    const list: Array<{ key: string; label: string; photos: string[] }> = [
      { key: "gallery", label: "Gallery", photos: gallery },
    ];
    for (const project of projects) {
      const urls = project.items.map((item) => item.url).filter(Boolean);
      if (project.coverUrl && !urls.includes(project.coverUrl)) {
        urls.unshift(project.coverUrl);
      }
      if (urls.length) {
        list.push({ key: project.id, label: project.title, photos: urls });
      }
    }
    return list.filter((album) => album.photos.length > 0 || album.key === "gallery");
  }, [photos, projects]);

  const [albumKey, setAlbumKey] = useState(album ?? "gallery");
  useEffect(() => {
    if (album) setAlbumKey(album);
  }, [album]);
  const activeAlbum = albums.find((album) => album.key === albumKey) ?? albums[0];
  const list = activeAlbum?.photos ?? [];
  const hero = coverUrl || photos[0] || projects.find((project) => project.coverUrl)?.coverUrl || list[0] || null;

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState<string | null>(null);
  const introEmbed = introVideoUrl ? parseEmbed(introVideoUrl) : null;
  // Category feel: venues read wide and low, portrait-led categories (bridal, makeup) stand taller.
  const collageHeight =
    cinematic === "venue"
      ? "h-64 sm:h-80 md:h-96"
      : cinematic === "portrait"
        ? "h-96 sm:h-[30rem] md:h-[32rem]"
        : "h-72 sm:h-96 md:h-[28rem]";

  useEffect(() => {
    setActive(0);
  }, [albumKey]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (!list.length) return;
      if (event.key === "ArrowRight") setActive((current) => (current + 1) % list.length);
      if (event.key === "ArrowLeft") setActive((current) => (current - 1 + list.length) % list.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, list.length]);

  const displayHero = list[Math.min(active, Math.max(list.length - 1, 0))] || hero;
  const collage = (list.length ? list : hero ? [hero] : []).slice(0, 5);
  const showAlbumTabs = projects.some((project) => project.items.length > 0 || project.coverUrl);
  const reduce = useReducedMotion();
  // Stable per-instance ID so layoutId doesn't clash across multiple galleries on the page
  const galleryId = useMemo(() => `gallery-${name.replace(/\s+/g, "-").toLowerCase()}`, [name]);

  if (!displayHero && !introEmbed && !videos.length) {
    return <div className={cn("min-h-72 rounded-3xl bg-secondary", className)} />;
  }

  return (
    <div className={cn("grid content-start gap-3", className)}>
      {showAlbumTabs && albums.length > 1 ? (
        <LayoutGroup id={`${galleryId}-albums`}>
          <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-card p-1 ring-1 ring-border [scrollbar-width:none]">
            {albums.map((album) => {
              const isActive = album.key === (activeAlbum?.key ?? albumKey);
              return (
                <button
                  key={album.key}
                  type="button"
                  className={cn(
                    "relative isolate h-9 shrink-0 rounded-full px-4 text-sm whitespace-nowrap transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setAlbumKey(album.key)}
                >
                  {isActive ? (
                    <motion.span
                      layoutId={`${galleryId}-album-pill`}
                      className="absolute inset-0 -z-10 rounded-full bg-primary shadow-md"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  {album.label}
                  <span className="ml-1.5 text-xs opacity-70">{album.photos.length}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      ) : null}

      {collage.length ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeAlbum?.key ?? "gallery"}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn("grid gap-2", collageHeight, COLLAGE_GRID[collage.length])}
          >
            {collage.map((src, index) => {
              const remaining = list.length - collage.length;
              const isLast = index === collage.length - 1 && remaining > 0;
              return (
                <motion.button
                  key={`${src}-${index}`}
                  type="button"
                  initial={reduce ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "group relative overflow-hidden bg-muted text-left",
                    COLLAGE_TILE[collage.length]?.[index],
                    tileRadius(collage.length, index),
                  )}
                  onClick={() => {
                    setActive(index);
                    setOpen(true);
                  }}
                  aria-label={`Open photo ${index + 1}`}
                >
                  <motion.img
                    src={src}
                    alt={index === 0 ? name : ""}
                    layoutId={reduce ? undefined : `${galleryId}-${activeAlbum?.key}-${index}`}
                    className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/15" />
                  {isLast ? (
                    <span className="absolute inset-0 grid place-items-center bg-ink/55 text-paper backdrop-blur-[2px] transition group-hover:bg-ink/45">
                      <span className="text-center">
                        <span className="block font-serif text-3xl">+{remaining}</span>
                        <span className="text-xs text-paper/80">more photos</span>
                      </span>
                    </span>
                  ) : null}
                  {index === 0 ? (
                    <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-3 py-1.5 text-xs font-medium text-ink shadow-md backdrop-blur">
                      <Icon icon={Images} size="xs" lottie={false} /> {list.length} photos
                    </span>
                  ) : null}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      ) : null}

      {introEmbed ? (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-ink">
          <iframe
            title={`${name} intro video`}
            src={introEmbed}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}

      {videos.length ? (
        <div className="grid gap-2">
          <p className="text-label font-medium tracking-eyebrow text-primary/90 uppercase">Videos</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {videos.map((video) => {
              const thumb = youtubeThumb(video.url);
              return (
                <button
                  key={video.id}
                  type="button"
                  className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-secondary"
                  onClick={() => setVideoOpen(video.url)}
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <span className="absolute inset-0 grid place-items-center bg-ink/35 text-paper">
                    <Icon icon={Play} size="sm" />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 truncate bg-ink/50 px-2 py-1 text-label text-paper">
                    {video.title || "Watch"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {open && list.length ? (
          <motion.div
            key="gallery-lightbox"
            className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${name} gallery`}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <button
              type="button"
              className="absolute top-4 right-4 rounded-full bg-paper/10 p-2 text-paper"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <Icon icon={X} size="sm" />
            </button>
            {list.length > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute left-4 rounded-full bg-paper/10 p-2 text-paper"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActive((current) => (current - 1 + list.length) % list.length);
                  }}
                  aria-label="Previous"
                >
                  <Icon icon={ChevronLeft} size="sm" />
                </button>
                <button
                  type="button"
                  className="absolute right-4 rounded-full bg-paper/10 p-2 text-paper md:right-16"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActive((current) => (current + 1) % list.length);
                  }}
                  aria-label="Next"
                >
                  <Icon icon={ChevronRight} size="sm" />
                </button>
              </>
            ) : null}
            {/* Same layoutId as hero — Framer morphs the image from grid → fullscreen */}
            {}
            <motion.img
              src={list[Math.min(active, list.length - 1)]!}
              alt={name}
              layoutId={reduce || active > 4 ? undefined : `${galleryId}-${activeAlbum?.key}-${active}`}
              className="max-h-[85vh] max-w-5xl rounded-2xl object-contain"
              onClick={(event) => event.stopPropagation()}
            />
            <p className="absolute bottom-4 text-sm text-paper/80">
              {active + 1} / {list.length}
              {activeAlbum && activeAlbum.key !== "gallery" ? ` · ${activeAlbum.label}` : ""}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {videoOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} video`}
          onClick={() => setVideoOpen(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-paper/10 p-2 text-paper"
            onClick={() => setVideoOpen(null)}
            aria-label="Close"
          >
            <Icon icon={X} size="sm" />
          </button>
          {parseEmbed(videoOpen) ? (
            <iframe
              title={`${name} video`}
              src={parseEmbed(videoOpen)!}
              className="aspect-video w-full max-w-4xl rounded-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onClick={(event) => event.stopPropagation()}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
