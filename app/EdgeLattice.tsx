"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type PointerState = { x: number; y: number; active: boolean };
type Impulse = { x: number; y: number; t: number };

type Layer = {
  phase: number;
  offsetX: number;
  offsetY: number;
  alpha: number;
  width: number;
};

const MIN_WIDTH = 820;
const STEP = 30;
const HOVER_RADIUS = 260;
const CLICK_RADIUS = 350;
const CLICK_DURATION = 850;
const ISOS = [-0.48, 0.12, 0.64];
const LAYERS: Layer[] = [
  { phase: 0, offsetX: 0, offsetY: 0, alpha: 1, width: 1 },
  { phase: 1.2, offsetX: 6, offsetY: -4, alpha: 0.42, width: 0.82 },
  { phase: 2.3, offsetX: 11, offsetY: -8, alpha: 0.2, width: 0.68 },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export default function EdgeLattice() {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const baseCanvas = baseRef.current;
    const overlayCanvas = overlayRef.current;
    if (!baseCanvas || !overlayCanvas) return;

    const baseContext = baseCanvas.getContext("2d");
    const overlayContext = overlayCanvas.getContext("2d");
    if (!baseContext || !overlayContext) return;

    const base = baseContext;
    const overlay = overlayContext;
    const wideEnough = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const pointer: PointerState = { x: -1000, y: -1000, active: false };
    const impulses: Impulse[] = [];

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let resizeTimer = 0;

    const pageHeight = () =>
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.clientHeight,
        window.innerHeight,
      );

    const transitionAt = (x: number) => {
      const half = Math.max(1, width * 0.5);
      const edgeDistance = Math.min(x, width - x);
      return smoothstep(0.06, 0.95, clamp(edgeDistance / half, 0, 1));
    };

    const localCellSize = (x: number) => 38 - transitionAt(x) * 30;

    const interactionAt = (x: number, y: number, now: number) => {
      let hover = 0;
      if (pointer.active) {
        hover = 1 - smoothstep(0, HOVER_RADIUS, Math.hypot(pointer.x - x, pointer.y - y));
      }

      let click = 0;
      for (const impulse of impulses) {
        const age = now - impulse.t;
        if (age > CLICK_DURATION) continue;
        const distance = Math.hypot(impulse.x - x, impulse.y - y);
        const spatial = 1 - smoothstep(0, CLICK_RADIUS, distance);
        const temporal = 1 - smoothstep(0, CLICK_DURATION, age);
        click = Math.max(click, spatial * temporal);
      }

      return { hover, click };
    };

    const gyroid = (
      x: number,
      y: number,
      phase: number,
      now: number,
      interactive: boolean,
    ) => {
      const cellSize = localCellSize(x);
      const interaction = interactive ? interactionAt(x, y, now) : { hover: 0, click: 0 };
      const frequency =
        (Math.PI * 2) /
        Math.max(7, cellSize * 2.65) *
        (1 + interaction.hover * 0.48 + interaction.click * 1.2);

      const sx = x * frequency + phase + interaction.click * 1.9;
      const sy = y * frequency * 0.94 - phase * 0.58 - interaction.hover * 0.3;
      const sz =
        x * frequency * 0.52 -
        y * frequency * 0.32 +
        phase * 1.08 +
        interaction.click * 2.55;

      return (
        Math.sin(sx) * Math.cos(sy) +
        Math.sin(sy) * Math.cos(sz) +
        Math.sin(sz) * Math.cos(sx)
      );
    };

    const lerp = (a: Point, b: Point, va: number, vb: number, iso: number) => {
      const d = vb - va;
      const t = Math.abs(d) < 1e-6 ? 0.5 : (iso - va) / d;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    };

    const segmentsForCell = (
      corners: [Point, Point, Point, Point],
      values: [number, number, number, number],
      iso: number,
    ): [Point, Point][] => {
      const [tl, tr, br, bl] = corners;
      const [v0, v1, v2, v3] = values;
      const hits: { edge: string; point: Point }[] = [];

      if ((v0 < iso) !== (v1 < iso)) hits.push({ edge: "t", point: lerp(tl, tr, v0, v1, iso) });
      if ((v1 < iso) !== (v2 < iso)) hits.push({ edge: "r", point: lerp(tr, br, v1, v2, iso) });
      if ((v2 < iso) !== (v3 < iso)) hits.push({ edge: "b", point: lerp(br, bl, v2, v3, iso) });
      if ((v3 < iso) !== (v0 < iso)) hits.push({ edge: "l", point: lerp(bl, tl, v3, v0, iso) });

      if (hits.length === 2) return [[hits[0].point, hits[1].point]];
      if (hits.length !== 4) return [];

      const top = hits.find((h) => h.edge === "t")?.point;
      const right = hits.find((h) => h.edge === "r")?.point;
      const bottom = hits.find((h) => h.edge === "b")?.point;
      const left = hits.find((h) => h.edge === "l")?.point;
      if (!top || !right || !bottom || !left) return [];

      const center = (v0 + v1 + v2 + v3) * 0.25;
      return center >= iso
        ? [[top, left], [right, bottom]]
        : [[top, right], [bottom, left]];
    };

    const drawSegment = (
      context: CanvasRenderingContext2D,
      start: Point,
      end: Point,
      transition: number,
      alpha: number,
      lineWidth: number,
    ) => {
      const midX = (start.x + end.x) * 0.5;
      const midY = (start.y + end.y) * 0.5;
      const scale = Math.pow(1 - transition, 1.55);

      if (scale < 0.18) {
        context.beginPath();
        context.arc(midX, midY, 0.5 + (1 - transition) * 0.35, 0, Math.PI * 2);
        context.fillStyle = `rgba(158, 226, 255, ${alpha * 0.75})`;
        context.fill();
        return;
      }

      context.beginPath();
      context.moveTo(midX + (start.x - midX) * scale, midY + (start.y - midY) * scale);
      context.lineTo(midX + (end.x - midX) * scale, midY + (end.y - midY) * scale);
      context.strokeStyle = `rgba(119, 222, 248, ${alpha})`;
      context.lineWidth = lineWidth * (0.55 + 0.45 * scale);
      context.stroke();
    };

    const drawRegion = (
      context: CanvasRenderingContext2D,
      minX: number,
      minY: number,
      maxX: number,
      maxY: number,
      now: number,
      interactive: boolean,
    ) => {
      if (!wideEnough.matches) return;

      const yStart = Math.max(52, minY);
      const yEnd = Math.min(Math.max(200, height - 72), maxY);
      const xStart = Math.max(0, minX);
      const xEnd = Math.min(width, maxX);

      for (let y = yStart; y < yEnd; y += STEP) {
        for (let x = xStart; x < xEnd; x += STEP) {
          const centerX = x + STEP * 0.5;
          const transition = transitionAt(centerX);
          const layerCount = transition > 0.62 ? 1 : transition > 0.34 ? 2 : 3;
          const isos = transition > 0.72 ? [0.12] : ISOS;

          for (let li = 0; li < layerCount; li += 1) {
            const layer = LAYERS[li];
            const tl = { x: x + layer.offsetX, y: y + layer.offsetY };
            const tr = { x: Math.min(x + STEP, width) + layer.offsetX, y: y + layer.offsetY };
            const br = {
              x: Math.min(x + STEP, width) + layer.offsetX,
              y: Math.min(y + STEP, yEnd) + layer.offsetY,
            };
            const bl = { x: x + layer.offsetX, y: Math.min(y + STEP, yEnd) + layer.offsetY };

            const values: [number, number, number, number] = [
              gyroid(tl.x, tl.y, layer.phase, now, interactive),
              gyroid(tr.x, tr.y, layer.phase, now, interactive),
              gyroid(br.x, br.y, layer.phase, now, interactive),
              gyroid(bl.x, bl.y, layer.phase, now, interactive),
            ];

            const interaction = interactive
              ? interactionAt(centerX, y + STEP * 0.5, now)
              : { hover: 0, click: 0 };
            const interactionBoost = 1 + interaction.hover * 0.45 + interaction.click * 0.95;
            const presence = 1 - transition * 0.7;

            for (const iso of isos) {
              const isoWeight = 1 - Math.min(1, Math.abs(iso) / 0.9);
              const alpha =
                (0.045 + presence * 0.13) *
                layer.alpha *
                (0.72 + isoWeight * 0.28) *
                interactionBoost;
              const lineWidth = (0.72 + presence * 1.2 + isoWeight * 0.5) * layer.width;

              for (const [start, end] of segmentsForCell([tl, tr, br, bl], values, iso)) {
                drawSegment(context, start, end, transition, alpha, lineWidth);
              }
            }
          }
        }
      }
    };

    const renderBase = () => {
      base.clearRect(0, 0, width, height);
      drawRegion(base, 0, 0, width, height, 0, false);
    };

    const sizeCanvases = () => {
      width = document.documentElement.clientWidth;
      height = pageHeight();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.1);

      for (const canvas of [baseCanvas, overlayCanvas]) {
        canvas.width = Math.max(1, Math.round(width * pixelRatio));
        canvas.height = Math.max(1, Math.round(height * pixelRatio));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      base.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      overlay.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      renderBase();
      overlay.clearRect(0, 0, width, height);
    };

    const requestInteraction = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(renderInteraction);
    };

    const renderInteraction = (now: number) => {
      frame = 0;
      for (let i = impulses.length - 1; i >= 0; i -= 1) {
        if (now - impulses[i].t > CLICK_DURATION) impulses.splice(i, 1);
      }

      overlay.clearRect(0, 0, width, height);

      let cx = pointer.x;
      let cy = pointer.y;
      let radius = pointer.active ? HOVER_RADIUS : 0;
      for (const impulse of impulses) {
        cx = impulse.x;
        cy = impulse.y;
        radius = Math.max(radius, CLICK_RADIUS);
      }

      if (radius > 0) {
        const minX = Math.max(0, cx - radius - 40);
        const maxX = Math.min(width, cx + radius + 40);
        const minY = Math.max(0, cy - radius - 40);
        const maxY = Math.min(height, cy + radius + 40);
        drawRegion(overlay, minX, minY, maxX, maxY, now, true);
      }

      if (impulses.length > 0) frame = window.requestAnimationFrame(renderInteraction);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.pageX;
      pointer.y = event.pageY;
      pointer.active = true;
      requestInteraction();
    };

    const leave = () => {
      pointer.active = false;
      requestInteraction();
    };

    const click = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, summary, [role='button']")) return;
      impulses.push({ x: event.pageX, y: event.pageY, t: performance.now() });
      if (impulses.length > 3) impulses.shift();
      requestInteraction();
    };

    const scheduleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(sizeCanvases, 120);
    };

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleResize) : null;
    observer?.observe(document.body);
    window.addEventListener("resize", scheduleResize);
    window.visualViewport?.addEventListener("resize", scheduleResize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);

    sizeCanvases();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      observer?.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.visualViewport?.removeEventListener("resize", scheduleResize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <>
      <style>{`
        .lattice-layer {
          position: absolute;
          inset: 0 auto auto 0;
          z-index: -1;
          width: 100%;
          height: auto;
          max-width: none !important;
          pointer-events: none;
          mask-image: none !important;
          -webkit-mask-image: none !important;
        }
        .lattice-base { opacity: .9; }
        .lattice-overlay { opacity: .95; }
        @media (max-width: 819px) {
          .lattice-layer { display: none !important; }
        }
      `}</style>
      <canvas ref={baseRef} className="lattice-layer lattice-base" aria-hidden="true" />
      <canvas ref={overlayRef} className="lattice-layer lattice-overlay" aria-hidden="true" />
    </>
  );
}
