"use client";

import { useEffect, useRef } from "react";
import type { MoodboardAssetUpsert, MoodboardScene } from "@ceylonweddings/contracts";
import { api } from "@ceylonweddings/web";
import { useMoodboardStore } from "./store";

export type AutosaveStatus = "idle" | "saving" | "saved" | "conflict" | "error";

export function useMoodboardAutosave(opts: {
  boardId: string;
  version: number;
  assets: MoodboardAssetUpsert[];
  enabled: boolean;
  onSaved?: (version: number, scene: MoodboardScene) => void;
  onStatus?: (status: AutosaveStatus, message?: string) => void;
}) {
  const versionRef = useRef(opts.version);
  const assetsRef = useRef(opts.assets);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    versionRef.current = opts.version;
  }, [opts.version]);

  useEffect(() => {
    assetsRef.current = opts.assets;
  }, [opts.assets]);

  const dirty = useMoodboardStore((s) => s.dirty);
  const scene = useMoodboardStore((s) => s.scene);
  const markClean = useMoodboardStore((s) => s.markClean);

  useEffect(() => {
    if (!opts.enabled || !dirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const boardId = opts.boardId;
    const onSaved = opts.onSaved;
    const onStatus = opts.onStatus;
    timerRef.current = setTimeout(async () => {
      onStatus?.("saving");
      try {
        const imageAssetIds = new Set(
          scene.items.filter((i) => i.type === "image").map((i) => (i as { assetId: string }).assetId),
        );
        const assets = assetsRef.current.filter((a) => imageAssetIds.has(a.fileId));
        const saved = await api.wedding.saveMoodboardScene(boardId, {
          scene,
          assets,
          expectedVersion: versionRef.current,
        });
        versionRef.current = saved.version;
        markClean();
        onSaved?.(saved.version, saved.scene);
        onStatus?.("saved");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Save failed";
        if (/updated elsewhere|conflict/i.test(message)) {
          onStatus?.("conflict", message);
        } else {
          onStatus?.("error", message);
        }
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // intentionally omit opts object identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, scene, opts.enabled, opts.boardId, markClean]);
}
