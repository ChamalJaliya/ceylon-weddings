"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { FolderPlus, ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Icon } from "../components/icon";
import { cn } from "../lib/utils";
import { FieldBlock, StudioCollapse, TagInput } from "./creator-form";
import { MediaFrame } from "./media-frame";
import { Reveal } from "./motion";

const fieldClass = "h-11 rounded-xl border-border/80 bg-background/70";

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Reveal className="grid gap-4 rounded-2xl border border-border/50 bg-gradient-to-b from-background/70 to-background/30 p-4 md:p-5" y={10}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-3">
        <div className="grid gap-0.5">
          <h3 className="font-medium tracking-tight">{title}</h3>
          {description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Reveal>
  );
}

export type MediaStudioProject = {
  id?: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  eventDate?: string | null;
  sortOrder: number;
  items: Array<{ id?: string; url: string; sortOrder: number }>;
};

export type MediaStudioVideo = {
  id?: string;
  url: string;
  title?: string | null;
  sortOrder: number;
};

export type MediaUploadFn = (file: File, kind: "image" | "cover") => Promise<string>;

function youtubeThumb(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    else if (host.includes("youtube")) {
      id = parsed.searchParams.get("v") ?? parsed.pathname.split("/").filter(Boolean).at(-1) ?? null;
    }
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

async function uploadMany(files: FileList | File[], kind: "image" | "cover", onUpload?: MediaUploadFn) {
  if (!onUpload) throw new Error("Uploads are not available");
  const urls: string[] = [];
  for (const file of Array.from(files)) {
    urls.push(await onUpload(file, kind));
  }
  return urls;
}

function ImageDropZone({
  label,
  onUpload,
  onUrls,
  multiple = false,
  kind = "image",
}: {
  label: string;
  onUpload?: MediaUploadFn;
  onUrls: (urls: string[]) => void;
  multiple?: boolean;
  kind?: "image" | "cover";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      const urls = await uploadMany(files, kind, onUpload);
      onUrls(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={!onUpload || busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "grid place-items-center gap-2 rounded-2xl border border-dashed border-border/80 bg-secondary/20 px-4 py-6 text-center transition",
          onUpload ? "hover:border-primary/50 hover:bg-secondary/40" : "opacity-60",
        )}
      >
        <span className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Icon icon={Upload} size="md" />
        </span>
        <p className="text-sm font-medium">{busy ? "Uploading…" : label}</p>
        <p className="text-xs text-muted-foreground">
          {onUpload ? "Drop files or click to browse" : "Configure S3 to enable uploads"}
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => void handleFiles(event.target.files)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function MediaStudioEditor({
  coverUrl,
  galleryUrls,
  introVideoUrl,
  projects,
  videos,
  onCoverChange,
  onGalleryChange,
  onIntroVideoChange,
  onProjectsChange,
  onVideosChange,
  onUpload,
}: {
  coverUrl: string;
  galleryUrls: string[];
  introVideoUrl: string;
  projects: MediaStudioProject[];
  videos: MediaStudioVideo[];
  onCoverChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
  onIntroVideoChange: (url: string) => void;
  onProjectsChange: (projects: MediaStudioProject[]) => void;
  onVideosChange: (videos: MediaStudioVideo[]) => void;
  onUpload?: MediaUploadFn;
}) {
  const [videoDraft, setVideoDraft] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});

  function updateProject(index: number, next: MediaStudioProject) {
    const row = [...projects];
    row[index] = next;
    onProjectsChange(row);
  }

  return (
    <div className="grid gap-6">
      <Panel title="Cover" description="Hero image couples see first — wide, bright, editorial.">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="grid gap-3">
            <ImageDropZone
              label="Upload cover"
              kind="cover"
              onUpload={onUpload}
              onUrls={(urls) => {
                if (urls[0]) onCoverChange(urls[0]);
              }}
            />
            <FieldBlock label="Or paste cover URL" compact>
              <Input
                className={fieldClass}
                value={coverUrl}
                onChange={(e) => onCoverChange(e.target.value)}
                placeholder="https://…"
              />
            </FieldBlock>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-secondary/20">
            {coverUrl ? (
              <MediaFrame src={coverUrl} alt="" aspect="aspect-[4/5]" className="rounded-none" />
            ) : (
              <div className="grid aspect-[4/5] place-items-center text-xs text-muted-foreground">No cover yet</div>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        title="Gallery"
        description="General photos — no project required. Upload or paste URLs."
      >
        <ImageDropZone
          label="Upload gallery photos"
          multiple
          onUpload={onUpload}
          onUrls={(urls) => onGalleryChange([...galleryUrls, ...urls])}
        />
        <FieldBlock label="Or paste image URL" hint="Press Enter to add." compact>
          <TagInput
            values={galleryUrls}
            onChange={onGalleryChange}
            placeholder="Paste image URL and press Enter"
          />
        </FieldBlock>
        {galleryUrls.length ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {galleryUrls.map((src, index) => (
              <div key={`${src}-${index}`} className="group relative overflow-hidden rounded-xl border border-border/60">
                <MediaFrame src={src} alt="" aspect="aspect-square" className="rounded-none" />
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-full bg-background/90 p-1 opacity-0 transition group-hover:opacity-100"
                  onClick={() => onGalleryChange(galleryUrls.filter((_, i) => i !== index))}
                  aria-label="Remove photo"
                >
                  <Icon icon={Trash2} size="sm" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border/80 bg-secondary/20 px-4 py-8 text-center">
            <Icon icon={ImagePlus} size="md" className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Add a few distinct shots</p>
          </div>
        )}
      </Panel>

      <Panel title="Intro video" description="One featured YouTube or Vimeo link for the storefront hero.">
        <FieldBlock label="Intro video URL" compact>
          <Input
            className={fieldClass}
            value={introVideoUrl}
            onChange={(e) => onIntroVideoChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </FieldBlock>
      </Panel>

      <Panel
        title="Projects"
        description="Optional albums — titled shoots or weddings. Skip if a flat gallery is enough."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const index = projects.length;
              setOpenProjects((current) => ({ ...current, [`new-${index}`]: true }));
              onProjectsChange([
                ...projects,
                {
                  title: `Project ${projects.length + 1}`,
                  description: "",
                  coverUrl: null,
                  sortOrder: projects.length,
                  items: [],
                },
              ]);
            }}
          >
            <Icon icon={FolderPlus} size="sm" />
            Add project
          </Button>
        }
      >
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet — your general gallery still shows publicly.</p>
        ) : (
          <div className="grid gap-3">
            {projects.map((project, index) => {
              const key = project.id ?? `new-${index}`;
              const thumb = project.coverUrl || project.items[0]?.url;
              const photoCount = project.items.length;
              const expanded = openProjects[key] ?? photoCount === 0;
              return (
                <StudioCollapse
                  key={key}
                  open={expanded}
                  onOpenChange={(next) => setOpenProjects((current) => ({ ...current, [key]: next }))}
                  title={project.title.trim() || `Project ${index + 1}`}
                  subtitle={photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : "No photos yet"}
                  leading={
                    <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center text-muted-foreground">
                          <Icon icon={FolderPlus} size="sm" lottie={false} />
                        </span>
                      )}
                    </span>
                  }
                  action={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onProjectsChange(projects.filter((_, i) => i !== index))}
                    >
                      <Icon icon={Trash2} size="sm" />
                    </Button>
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldBlock label="Title" compact>
                      <Input
                        className={fieldClass}
                        value={project.title}
                        onChange={(e) => updateProject(index, { ...project, title: e.target.value })}
                        placeholder="Project title"
                      />
                    </FieldBlock>
                    <FieldBlock label="Cover URL" compact>
                      <Input
                        className={fieldClass}
                        value={project.coverUrl ?? ""}
                        onChange={(e) => updateProject(index, { ...project, coverUrl: e.target.value || null })}
                        placeholder="Optional cover URL"
                      />
                    </FieldBlock>
                  </div>
                  <ImageDropZone
                    label="Upload project photos"
                    multiple
                    onUpload={onUpload}
                    onUrls={(urls) =>
                      updateProject(index, {
                        ...project,
                        items: [
                          ...project.items,
                          ...urls.map((url, i) => ({ url, sortOrder: project.items.length + i })),
                        ],
                        coverUrl: project.coverUrl || urls[0] || null,
                      })
                    }
                  />
                  <TagInput
                    values={project.items.map((item) => item.url)}
                    onChange={(urls) =>
                      updateProject(index, {
                        ...project,
                        items: urls.map((url, i) => ({
                          id: project.items[i]?.id,
                          url,
                          sortOrder: i,
                        })),
                      })
                    }
                    placeholder="Paste project image URL and press Enter"
                  />
                  {project.items.length ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {project.items.map((item, itemIndex) => (
                        <div
                          key={`${item.url}-${itemIndex}`}
                          className="overflow-hidden rounded-xl border border-border/60"
                        >
                          <MediaFrame src={item.url} alt="" aspect="aspect-square" className="rounded-none" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </StudioCollapse>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Videos" description="YouTube or Vimeo links for your film reel.">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            className={fieldClass}
            value={videoDraft}
            onChange={(e) => setVideoDraft(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
          />
          <Input
            className={fieldClass}
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="Title (optional)"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const url = videoDraft.trim();
              if (!url) return;
              onVideosChange([
                ...videos,
                { url, title: videoTitle.trim() || null, sortOrder: videos.length },
              ]);
              setVideoDraft("");
              setVideoTitle("");
            }}
          >
            <Icon icon={Plus} size="sm" />
            Add
          </Button>
        </div>
        {videos.length ? (
          <div className="grid gap-2">
            {videos.map((video, index) => {
              const thumb = youtubeThumb(video.url);
              return (
                <div
                  key={video.id ?? `${video.url}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-border/70 p-2"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-14 w-24 rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-14 w-24 place-items-center rounded-lg bg-secondary text-xs text-muted-foreground">
                      Video
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{video.title || "Untitled video"}</p>
                    <p className="truncate text-xs text-muted-foreground">{video.url}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onVideosChange(videos.filter((_, i) => i !== index))}
                  >
                    <Icon icon={Trash2} size="sm" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

/** @deprecated Prefer MediaStudioEditor — kept for package-photo editors that only need URL paste. */
export function MediaListEditor({
  coverUrl,
  galleryUrls,
  onCoverChange,
  onGalleryChange,
}: {
  coverUrl: string;
  galleryUrls: string[];
  onCoverChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
}) {
  return (
    <MediaStudioEditor
      coverUrl={coverUrl}
      galleryUrls={galleryUrls}
      introVideoUrl=""
      projects={[]}
      videos={[]}
      onCoverChange={onCoverChange}
      onGalleryChange={onGalleryChange}
      onIntroVideoChange={() => undefined}
      onProjectsChange={() => undefined}
      onVideosChange={() => undefined}
    />
  );
}
