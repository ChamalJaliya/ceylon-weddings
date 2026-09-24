"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "../lib/utils";
import { MediaFrame } from "./media-frame";
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
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
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

export function VendorGallery({
  photos,
  coverUrl,
  name,
  className,
  cinematic = "default",
  projects = [],
  introVideoUrl,
  videos = [],
}: {
  photos: string[];
  coverUrl?: string | null;
  name: string;
  className?: string;
  cinematic?: "default" | "venue" | "portrait" | "detail";
  projects?: VendorGalleryProject[];
  introVideoUrl?: string | null;
  videos?: VendorGalleryVideo[];
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

  const [albumKey, setAlbumKey] = useState("gallery");
  const activeAlbum = albums.find((album) => album.key === albumKey) ?? albums[0];
  const list = activeAlbum?.photos ?? [];
  const hero =
    coverUrl ||
    photos[0] ||
    projects.find((project) => project.coverUrl)?.coverUrl ||
    list[0] ||
    null;

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState<string | null>(null);
  const introEmbed = introVideoUrl ? parseEmbed(introVideoUrl) : null;
  const aspect =
    cinematic === "venue"
      ? "aspect-[21/9]"
      : cinematic === "portrait"
        ? "aspect-[4/5] md:aspect-[16/10]"
        : cinematic === "detail"
          ? "aspect-square md:aspect-[16/10]"
          : "aspect-[16/10]";

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
  const showAlbumTabs = projects.some((project) => project.items.length > 0 || project.coverUrl);
  const reduce = useReducedMotion();
  // Stable per-instance ID so layoutId doesn't clash across multiple galleries on the page
  const galleryId = useMemo(() => `gallery-${name.replace(/\s+/g, "-").toLowerCase()}`, [name]);

  if (!displayHero && !introEmbed && !videos.length) {
    return <div className={cn("min-h-72 rounded-3xl bg-secondary", className)} />;
  }

  return (
    <div className={cn("grid content-start gap-3", className)}>
      {displayHero ? (
        <button type="button" className="relative block w-full self-start text-left" onClick={() => list.length && setOpen(true)}>
          {/* motion.img with layoutId so it expands seamlessly into the lightbox */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={displayHero}
            alt={name}
            layoutId={reduce ? undefined : `${galleryId}-hero`}
            className={cn("w-full rounded-3xl object-cover", aspect)}
            style={{ display: "block" }}
          />
          {list.length ? (
            <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-background/90 px-3 py-1 text-xs backdrop-blur">
              View gallery
            </span>
          ) : null}
        </button>
      ) : null}

      {showAlbumTabs && albums.length > 1 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {albums.map((album) => (
            <button
              key={album.key}
              type="button"
              className={cn(
                "h-8 shrink-0 rounded-full px-3 text-xs whitespace-nowrap transition",
                album.key === (activeAlbum?.key ?? albumKey)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setAlbumKey(album.key)}
            >
              {album.label}
            </button>
          ))}
        </div>
      ) : null}

      {list.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {list.slice(0, 8).map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              className={cn(
                "h-16 w-20 shrink-0 overflow-hidden rounded-xl ring-offset-background transition",
                index === active ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100",
              )}
              onClick={() => setActive(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {introEmbed ? (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-black">
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
          <p className="text-[11px] font-medium tracking-[0.18em] text-primary/90 uppercase">Videos</p>
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
                  <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                    <Icon icon={Play} size="sm" />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-[10px] text-white">
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
            className="fixed inset-0 z-50 grid place-items-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${name} gallery`}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ backgroundColor: "rgba(0,0,0,0.82)" }}
          >
            <button
              type="button"
              className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <Icon icon={X} size="sm" />
            </button>
            {list.length > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute left-4 rounded-full bg-white/10 p-2 text-white"
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
                  className="absolute right-4 rounded-full bg-white/10 p-2 text-white md:right-16"
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src={list[Math.min(active, list.length - 1)]!}
              alt={name}
              layoutId={reduce ? undefined : `${galleryId}-hero`}
              className="max-h-[85vh] max-w-5xl rounded-2xl object-contain"
              onClick={(event) => event.stopPropagation()}
            />
            <p className="absolute bottom-4 text-sm text-white/80">
              {active + 1} / {list.length}
              {activeAlbum && activeAlbum.key !== "gallery" ? ` · ${activeAlbum.label}` : ""}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {videoOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} video`}
          onClick={() => setVideoOpen(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white"
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
