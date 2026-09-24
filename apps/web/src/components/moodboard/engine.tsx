"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Ellipse, Line, Arrow, Text, Group, Transformer, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import {
  moodboardFontStack,
  moodboardKonvaFontStyle,
  moodboardVideoThumbUrl,
  youtubeEmbedUrl,
  type MoodboardAsset,
  type MoodboardItem,
} from "@ceylonweddings/contracts";
import { MoodboardRulers } from "./rulers";
import {
  createEllipseItem,
  createLineItem,
  createPathItem,
  createRectItem,
  createTextItem,
  useMoodboardStore,
} from "./store";

function shapeFill(value: string | undefined) {
  if (!value || value === "transparent") return undefined;
  return value;
}

function shapeStroke(value: string | undefined) {
  return value && value !== "transparent" ? value : "#1f1a16";
}

function useHtmlImage(url: string | undefined) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = url;
  }, [url]);
  return image;
}

function ItemNode({
  item,
  assetUrl,
  selected,
  listening,
  onSelect,
  onDragEnd,
  onDblClick,
}: {
  item: MoodboardItem;
  assetUrl?: string;
  selected: boolean;
  listening: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDblClick: (id: string) => void;
}) {
  const image = useHtmlImage(item.type === "image" || item.type === "video" ? assetUrl : undefined);
  const common = {
    id: item.id,
    x: item.x,
    y: item.y,
    rotation: item.rotation,
    draggable: listening && !item.locked,
    listening,
    opacity: "style" in item && item.style ? item.style.opacity : "opacity" in item ? item.opacity : 1,
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onSelect(item.id, e.evt.shiftKey);
    },
    onTap: (e: Konva.KonvaEventObject<Event>) => {
      e.cancelBubble = true;
      onSelect(item.id, false);
    },
    onDblClick: () => onDblClick(item.id),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragEnd(item.id, e.target.x(), e.target.y());
    },
  };

  if (item.type === "rect") {
    return (
      <Rect
        {...common}
        width={item.width}
        height={item.height}
        cornerRadius={item.cornerRadius}
        fill={shapeFill(item.style?.fill)}
        stroke={selected ? "#b4532a" : shapeStroke(item.style?.stroke)}
        strokeWidth={item.style?.strokeWidth ?? 2}
      />
    );
  }
  if (item.type === "ellipse") {
    return (
      <Ellipse
        {...common}
        offsetX={-item.width / 2}
        offsetY={-item.height / 2}
        x={item.x + item.width / 2}
        y={item.y + item.height / 2}
        radiusX={item.width / 2}
        radiusY={item.height / 2}
        fill={shapeFill(item.style?.fill)}
        stroke={selected ? "#b4532a" : shapeStroke(item.style?.stroke)}
        strokeWidth={item.style?.strokeWidth ?? 2}
        onDragEnd={(e) => {
          onDragEnd(item.id, e.target.x() - item.width / 2, e.target.y() - item.height / 2);
        }}
      />
    );
  }
  if (item.type === "line") {
    return (
      <Line
        {...common}
        points={item.points}
        stroke={selected ? "#b4532a" : shapeStroke(item.style?.stroke)}
        strokeWidth={item.style?.strokeWidth ?? 2}
        lineCap="round"
        lineJoin="round"
      />
    );
  }
  if (item.type === "arrow") {
    return (
      <Arrow
        {...common}
        points={item.points}
        stroke={selected ? "#b4532a" : shapeStroke(item.style?.stroke)}
        fill={selected ? "#b4532a" : shapeStroke(item.style?.stroke)}
        strokeWidth={item.style?.strokeWidth ?? 2}
        pointerLength={12}
        pointerWidth={12}
      />
    );
  }
  if (item.type === "path") {
    return (
      <Line
        {...common}
        points={item.points}
        stroke={selected ? "#b4532a" : item.stroke}
        strokeWidth={item.strokeWidth}
        tension={0.3}
        lineCap="round"
        lineJoin="round"
      />
    );
  }
  if (item.type === "text") {
    return (
      <Group {...common}>
        <Rect width={item.width} height={item.height} fill="transparent" />
        <Text
          text={item.text}
          width={item.width}
          fontSize={item.fontSize}
          fill={item.fill}
          align={item.align ?? "left"}
          fontFamily={moodboardFontStack(item.fontFamily)}
          fontStyle={moodboardKonvaFontStyle(item.bold, item.italic)}
          textDecoration={item.underline ? "underline" : ""}
          listening={false}
        />
      </Group>
    );
  }
  if (item.type === "sticky") {
    return (
      <Group {...common}>
        <Rect
          width={item.width}
          height={item.height}
          fill={item.fill}
          cornerRadius={4}
          shadowColor="rgba(31,26,22,0.12)"
          shadowBlur={12}
          shadowOffsetY={4}
          stroke={selected ? "#b4532a" : "transparent"}
          strokeWidth={selected ? 2 : 0}
        />
        <Text
          text={item.text}
          x={12}
          y={12}
          width={item.width - 24}
          height={item.height - 24}
          fontSize={item.fontSize}
          fill={item.textColor}
          align={item.align ?? "left"}
          fontFamily={moodboardFontStack(item.fontFamily)}
          fontStyle={moodboardKonvaFontStyle(item.bold, item.italic)}
          textDecoration={item.underline ? "underline" : ""}
          listening={false}
        />
      </Group>
    );
  }
  if (item.type === "image") {
    return (
      <KonvaImage
        {...common}
        image={image ?? undefined}
        width={item.width}
        height={item.height}
        stroke={selected ? "#b4532a" : undefined}
        strokeWidth={selected ? 2 : 0}
      />
    );
  }
  if (item.type === "video") {
    const playR = Math.min(22, Math.min(item.width, item.height) / 6);
    return (
      <Group {...common} width={item.width} height={item.height}>
        <Rect
          width={item.width}
          height={item.height}
          fill="#1f1a16"
          cornerRadius={6}
          stroke={selected ? "#b4532a" : "#333"}
          strokeWidth={selected ? 2 : 1}
        />
        {image ? (
          <KonvaImage
            image={image}
            width={item.width}
            height={item.height}
            cornerRadius={6}
            listening={false}
          />
        ) : null}
        <Rect
          width={item.width}
          height={item.height}
          fill="rgba(31,26,22,0.28)"
          cornerRadius={6}
          listening={false}
        />
        <Ellipse
          x={item.width / 2}
          y={item.height / 2}
          radiusX={playR}
          radiusY={playR}
          fill="rgba(255,250,245,0.92)"
          listening={false}
        />
        <Text
          text="▶"
          x={item.width / 2 - playR * 0.35}
          y={item.height / 2 - playR * 0.7}
          fontSize={playR}
          fill="#1f1a16"
          listening={false}
        />
      </Group>
    );
  }
  if (item.type === "frame") {
    return (
      <Group {...common}>
        <Rect
          width={item.width}
          height={item.height}
          stroke={item.stroke}
          strokeWidth={2}
          dash={[8, 6]}
          fill="rgba(196,165,116,0.04)"
        />
        {item.label ? (
          <Text text={item.label} y={-22} fontSize={12} fill={item.stroke} listening={false} />
        ) : null}
      </Group>
    );
  }
  return null;
}

export function MoodboardEngine({
  assets,
  className,
}: {
  assets: MoodboardAsset[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const drawingId = useRef<string | null>(null);
  const spacePan = useRef(false);
  const panning = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  const scene = useMoodboardStore((s) => s.scene);
  const tool = useMoodboardStore((s) => s.tool);
  const selectedIds = useMoodboardStore((s) => s.selectedIds);
  const readOnly = useMoodboardStore((s) => s.readOnly);
  const editingTextId = useMoodboardStore((s) => s.editingTextId);
  const setSelected = useMoodboardStore((s) => s.setSelected);
  const setEditingText = useMoodboardStore((s) => s.setEditingText);
  const addItem = useMoodboardStore((s) => s.addItem);
  const updateItem = useMoodboardStore((s) => s.updateItem);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);
  const updateCamera = useMoodboardStore((s) => s.updateCamera);
  const snap = useMoodboardStore((s) => s.snap);
  const deleteSelected = useMoodboardStore((s) => s.deleteSelected);
  const undo = useMoodboardStore((s) => s.undo);
  const redo = useMoodboardStore((s) => s.redo);
  const copySelected = useMoodboardStore((s) => s.copySelected);
  const duplicateSelected = useMoodboardStore((s) => s.duplicateSelected);
  const nudgeSelected = useMoodboardStore((s) => s.nudgeSelected);
  const zoomBy = useMoodboardStore((s) => s.zoomBy);
  const zoomTo = useMoodboardStore((s) => s.zoomTo);
  const fitToContent = useMoodboardStore((s) => s.fitToContent);
  const previewVideoId = useMoodboardStore((s) => s.previewVideoId);
  const setPreviewVideo = useMoodboardStore((s) => s.setPreviewVideo);

  const assetMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assets) map.set(a.fileId, a.publicUrl);
    return map;
  }, [assets]);

  const sortedItems = useMemo(
    () => [...scene.items].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
    [scene.items],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = () => {
      const next = { width: el.clientWidth, height: el.clientHeight };
      setSize(next);
      useMoodboardStore.getState().setViewport(next.width, next.height);
    };
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    apply();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const tr = trRef.current;
    if (!stage || !tr) return;
    const nodes = selectedIds
      .filter((id) => id !== previewVideoId)
      .map((id) => stage.findOne(`#${CSS.escape(id)}`))
      .filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, sortedItems, previewVideoId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.code === "Space") {
        spacePan.current = e.type === "keydown";
        e.preventDefault();
      }
      if (e.type !== "keydown") return;
      if (e.key === "Escape" && useMoodboardStore.getState().previewVideoId) {
        e.preventDefault();
        setPreviewVideo(null);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomBy(1.15);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        zoomBy(1 / 1.15);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        if (e.shiftKey) fitToContent();
        else zoomTo(1);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        zoomTo(1);
        return;
      }

      if (readOnly) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelected();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        nudgeSelected(dx, dy);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [
    readOnly,
    undo,
    redo,
    deleteSelected,
    copySelected,
    duplicateSelected,
    nudgeSelected,
    zoomBy,
    zoomTo,
    fitToContent,
    setPreviewVideo,
  ]);

  const toWorld = useCallback(
    (pointer: { x: number; y: number }) => {
      const { camera } = useMoodboardStore.getState().scene;
      return {
        x: snap((pointer.x - camera.x) / camera.zoom),
        y: snap((pointer.y - camera.y) / camera.zoom),
      };
    },
    [snap],
  );

  const onWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldZoom = scene.camera.zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const scaleBy = 1.05;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const zoom = Math.min(8, Math.max(0.15, direction > 0 ? oldZoom * scaleBy : oldZoom / scaleBy));
      const mousePointTo = {
        x: (pointer.x - scene.camera.x) / oldZoom,
        y: (pointer.y - scene.camera.y) / oldZoom,
      };
      updateCamera({
        zoom,
        x: pointer.x - mousePointTo.x * zoom,
        y: pointer.y - mousePointTo.y * zoom,
      });
    },
    [scene.camera, updateCamera],
  );

  const onPointerDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (readOnly) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      setCursor(pointer);

      const panMode = tool === "hand" || spacePan.current;
      if (panMode) {
        panning.current = true;
        lastPointer.current = pointer;
        return;
      }

      if (e.target === stage || e.target.getClassName?.() === "Layer") {
        if (tool === "select") {
          setSelected([]);
          return;
        }
        const world = toWorld(pointer);
        drawStart.current = world;
        const style = useMoodboardStore.getState().toolStyle;

        if (tool === "rect") {
          const item = createRectItem(world.x, world.y, 1, 1, style);
          drawingId.current = item.id;
          addItem(item);
        } else if (tool === "ellipse") {
          const item = createEllipseItem(world.x, world.y, 1, 1, style);
          drawingId.current = item.id;
          addItem(item);
        } else if (tool === "line" || tool === "arrow") {
          const item = createLineItem(
            [world.x, world.y, world.x, world.y],
            tool === "arrow",
            style,
          );
          drawingId.current = item.id;
          addItem(item);
        } else if (tool === "path") {
          const item = createPathItem([world.x, world.y], style);
          drawingId.current = item.id;
          addItem(item);
        } else if (tool === "text" || tool === "sticky") {
          const item = createTextItem(world.x, world.y, tool === "sticky", style);
          addItem(item);
          setEditingText(item.id);
          useMoodboardStore.getState().setTool("select");
        }
      }
    },
    [readOnly, tool, toWorld, addItem, setSelected, setEditingText],
  );

  const onPointerMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      setCursor(pointer);

      if (panning.current && lastPointer.current) {
        const dx = pointer.x - lastPointer.current.x;
        const dy = pointer.y - lastPointer.current.y;
        const cam = useMoodboardStore.getState().scene.camera;
        updateCamera({ x: cam.x + dx, y: cam.y + dy });
        lastPointer.current = pointer;
        return;
      }

      if (!drawingId.current || !drawStart.current) return;
      const world = toWorld(pointer);
      const start = drawStart.current;
      const id = drawingId.current;
      const item = useMoodboardStore.getState().scene.items.find((i) => i.id === id);
      if (!item) return;

      if (item.type === "rect" || item.type === "ellipse") {
        updateItem(id, {
          x: Math.min(start.x, world.x),
          y: Math.min(start.y, world.y),
          width: Math.max(8, Math.abs(world.x - start.x)),
          height: Math.max(8, Math.abs(world.y - start.y)),
        } as Partial<MoodboardItem>);
      } else if (item.type === "line" || item.type === "arrow") {
        updateItem(id, { points: [start.x, start.y, world.x, world.y] } as Partial<MoodboardItem>);
      } else if (item.type === "path") {
        updateItem(id, { points: [...item.points, world.x, world.y] } as Partial<MoodboardItem>);
      }
    },
    [toWorld, updateItem, updateCamera],
  );

  const onPointerUp = useCallback(() => {
    panning.current = false;
    lastPointer.current = null;
    if (drawingId.current) {
      drawingId.current = null;
      drawStart.current = null;
      useMoodboardStore.getState().setTool("select");
    }
  }, []);

  const onSelect = useCallback(
    (id: string, additive: boolean) => {
      if (tool === "eraser" && !readOnly) {
        pushHistory();
        useMoodboardStore.setState((state) => ({
          scene: { ...state.scene, items: state.scene.items.filter((i) => i.id !== id) },
          dirty: true,
          selectedIds: [],
        }));
        return;
      }
      if (tool !== "select" && tool !== "hand") return;
      setSelected(additive ? Array.from(new Set([...selectedIds, id])) : [id]);
    },
    [tool, readOnly, pushHistory, selectedIds, setSelected],
  );

  const onDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      pushHistory();
      updateItem(id, { x: snap(x), y: snap(y) } as Partial<MoodboardItem>);
    },
    [pushHistory, updateItem, snap],
  );

  const onTransformEnd = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    pushHistory();
    for (const id of selectedIds) {
      const node = stage.findOne(`#${CSS.escape(id)}`);
      if (!node) continue;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      const item = useMoodboardStore.getState().scene.items.find((i) => i.id === id);
      if (!item) continue;
      if (item.type === "rect" || item.type === "ellipse" || item.type === "image" || item.type === "sticky" || item.type === "text" || item.type === "video" || item.type === "frame") {
        updateItem(id, {
          x: snap(node.x()),
          y: snap(node.y()),
          width: Math.max(8, Math.abs((item as { width: number }).width * scaleX)),
          height: Math.max(8, Math.abs((item as { height: number }).height * scaleY)),
          rotation: node.rotation(),
        } as Partial<MoodboardItem>);
      } else {
        updateItem(id, { x: snap(node.x()), y: snap(node.y()), rotation: node.rotation() } as Partial<MoodboardItem>);
      }
    }
  }, [selectedIds, pushHistory, updateItem, snap]);

  const videoOverlays = sortedItems.filter((i) => i.type === "video");
  const editingItem = sortedItems.find((i) => i.id === editingTextId);

  return (
    <div ref={containerRef} className={className ?? "relative h-full w-full overflow-hidden bg-[#fffaf5]"}>
      {scene.rulers ? (
        <MoodboardRulers
          width={size.width}
          height={size.height}
          cameraX={scene.camera.x}
          cameraY={scene.camera.y}
          zoom={scene.camera.zoom}
          cursor={cursor}
        />
      ) : null}

      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={scene.camera.zoom}
        scaleY={scene.camera.zoom}
        x={scene.camera.x}
        y={scene.camera.y}
        onWheel={onWheel}
        onMouseDown={onPointerDown}
        onMousemove={onPointerMove}
        onMouseup={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        style={{
          cursor: tool === "hand" || spacePan.current ? "grab" : tool === "eraser" ? "cell" : "default",
        }}
      >
        <Layer listening={false}>
          <Rect
            x={-50000}
            y={-50000}
            width={100000}
            height={100000}
            fill={scene.background}
          />
          {scene.grid.enabled
            ? Array.from({ length: 80 }).flatMap((_, i) => {
                const g = scene.grid.size;
                const originX = Math.floor((-scene.camera.x / scene.camera.zoom) / g) * g;
                const originY = Math.floor((-scene.camera.y / scene.camera.zoom) / g) * g;
                const x = originX + i * g;
                const y = originY + i * g;
                return [
                  <Line
                    key={`gx-${i}`}
                    points={[x, originY - 2000, x, originY + 4000]}
                    stroke="#1f1a16"
                    strokeWidth={1 / scene.camera.zoom}
                    opacity={0.06}
                  />,
                  <Line
                    key={`gy-${i}`}
                    points={[originX - 2000, y, originX + 4000, y]}
                    stroke="#1f1a16"
                    strokeWidth={1 / scene.camera.zoom}
                    opacity={0.06}
                  />,
                ];
              })
            : null}
        </Layer>
        <Layer>
          {sortedItems.map((item) => (
            <ItemNode
              key={item.id}
              item={item}
              assetUrl={
                item.type === "image"
                  ? assetMap.get(item.assetId)
                  : item.type === "video"
                    ? (moodboardVideoThumbUrl(item.url) ?? undefined)
                    : undefined
              }
              selected={selectedIds.includes(item.id)}
              listening={!readOnly}
              onSelect={onSelect}
              onDragEnd={onDragEnd}
              onDblClick={(id) => {
                const it = useMoodboardStore.getState().scene.items.find((x) => x.id === id);
                if (it && (it.type === "text" || it.type === "sticky")) setEditingText(id);
                if (it && it.type === "video") {
                  setSelected([id]);
                  useMoodboardStore.getState().setPreviewVideo(id);
                }
              }}
            />
          ))}
          {!readOnly ? (
            <Transformer
              ref={trRef}
              rotateEnabled
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              borderStroke="#b4532a"
              anchorStroke="#b4532a"
              anchorFill="#fffaf5"
              onTransformEnd={onTransformEnd}
            />
          ) : null}
        </Layer>
      </Stage>

      {videoOverlays.map((item) => {
        if (item.type !== "video") return null;
        const embed = youtubeEmbedUrl(item.url);
        if (!embed) return null;
        const playing = readOnly || previewVideoId === item.id;
        if (!playing) return null;
        const left = item.x * scene.camera.zoom + scene.camera.x;
        const top = item.y * scene.camera.zoom + scene.camera.y;
        return (
          <div
            key={`vid-${item.id}`}
            className="absolute overflow-hidden rounded-md shadow-md"
            style={{
              left,
              top,
              width: item.width * scene.camera.zoom,
              height: item.height * scene.camera.zoom,
              zIndex: 20,
            }}
          >
            <iframe
              title="Moodboard video"
              src={embed}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {!readOnly ? (
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="absolute top-2 right-2 rounded-full bg-[#1f1a16]/85 px-2.5 py-1 text-[11px] font-medium text-[#fffaf5] shadow"
              >
                Done
              </button>
            ) : null}
          </div>
        );
      })}

      {editingItem && (editingItem.type === "text" || editingItem.type === "sticky") ? (
        <textarea
          autoFocus
          className="absolute z-30 resize-none rounded border border-[#b4532a] bg-white/95 p-2 shadow-lg outline-none"
          style={{
            left: editingItem.x * scene.camera.zoom + scene.camera.x,
            top: editingItem.y * scene.camera.zoom + scene.camera.y,
            width: editingItem.width * scene.camera.zoom,
            height: editingItem.height * scene.camera.zoom,
            fontSize: editingItem.fontSize * scene.camera.zoom,
            fontFamily: moodboardFontStack(editingItem.fontFamily),
            fontWeight: editingItem.bold ? 700 : 400,
            fontStyle: editingItem.italic ? "italic" : "normal",
            textDecoration: editingItem.underline ? "underline" : "none",
            textAlign: editingItem.align ?? "left",
            color: editingItem.type === "text" ? editingItem.fill : editingItem.textColor,
            background: editingItem.type === "sticky" ? editingItem.fill : "#fff",
            padding: editingItem.type === "sticky" ? 12 * scene.camera.zoom : 8,
          }}
          value={editingItem.text}
          onChange={(e) => updateItem(editingItem.id, { text: e.target.value } as Partial<MoodboardItem>)}
          onBlur={() => setEditingText(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditingText(null);
          }}
        />
      ) : null}
    </div>
  );
}
