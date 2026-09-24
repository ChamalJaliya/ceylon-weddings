"use client";

export function MoodboardRulers({
  width,
  height,
  cameraX,
  cameraY,
  zoom,
  cursor,
}: {
  width: number;
  height: number;
  cameraX: number;
  cameraY: number;
  zoom: number;
  cursor: { x: number; y: number } | null;
}) {
  const major = 100;
  const minor = 20;
  const top: Array<{ x: number; major: boolean; label?: string }> = [];
  const left: Array<{ y: number; major: boolean; label?: string }> = [];

  const worldLeft = -cameraX / zoom;
  const worldTop = -cameraY / zoom;
  const startX = Math.floor(worldLeft / minor) * minor;
  const endX = worldLeft + width / zoom + major;
  for (let w = startX; w <= endX; w += minor) {
    const x = w * zoom + cameraX;
    if (x < 24 || x > width) continue;
    const isMajor = Math.abs(w % major) < 0.001 || Math.abs(w % major) > major - 0.001;
    top.push({ x, major: isMajor, label: isMajor ? String(Math.round(w)) : undefined });
  }

  const startY = Math.floor(worldTop / minor) * minor;
  const endY = worldTop + height / zoom + major;
  for (let w = startY; w <= endY; w += minor) {
    const y = w * zoom + cameraY;
    if (y < 24 || y > height) continue;
    const isMajor = Math.abs(w % major) < 0.001 || Math.abs(w % major) > major - 0.001;
    left.push({ y, major: isMajor, label: isMajor ? String(Math.round(w)) : undefined });
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden text-[#5c5346]">
      <svg className="absolute left-6 top-0 h-6 w-[calc(100%-1.5rem)]" aria-hidden>
        <rect width="100%" height="100%" fill="rgba(255,250,245,0.96)" />
        {top.map((m, i) => (
          <g key={`t-${i}`}>
            <line
              x1={m.x}
              y1={m.major ? 6 : 14}
              x2={m.x}
              y2={24}
              stroke="currentColor"
              strokeOpacity={m.major ? 0.5 : 0.25}
            />
            {m.label ? (
              <text x={m.x + 3} y={11} fontSize={9} fill="currentColor" fillOpacity={0.7}>
                {m.label}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <svg className="absolute left-0 top-6 h-[calc(100%-1.5rem)] w-6" aria-hidden>
        <rect width="100%" height="100%" fill="rgba(255,250,245,0.96)" />
        {left.map((m, i) => (
          <g key={`l-${i}`}>
            <line
              x1={m.major ? 6 : 14}
              y1={m.y}
              x2={24}
              y2={m.y}
              stroke="currentColor"
              strokeOpacity={m.major ? 0.5 : 0.25}
            />
          </g>
        ))}
      </svg>
      <div className="absolute left-0 top-0 size-6 bg-[#fffaf5]" />
      {cursor ? (
        <>
          <div
            className="absolute top-6 bottom-0 w-px bg-[#b4532a]/35"
            style={{ left: cursor.x }}
          />
          <div
            className="absolute left-6 right-0 h-px bg-[#b4532a]/35"
            style={{ top: cursor.y }}
          />
        </>
      ) : null}
    </div>
  );
}
