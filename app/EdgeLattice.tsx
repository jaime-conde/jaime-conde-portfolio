"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type PointerState = { x: number; y: number; active: boolean };
type Impulse = { x: number; y: number; t: number };
type Layer = { phase: number; offsetX: number; offsetY: number; alpha: number; width: number };

const MIN_WIDTH = 820;
const SAMPLE_STEP = 12;
const HOVER_RADIUS = 150;
const CLICK_RADIUS = 185;
const CLICK_DURATION = 720;
const ISOS = [-0.42, 0.16];
const LAYERS: Layer[] = [
  { phase: 0, offsetX: 0, offsetY: 0, alpha: 1, width: 1 },
  { phase: 1.12, offsetX: 4, offsetY: -3, alpha: 0.42, width: 0.82 },
  { phase: 2.18, offsetX: 8, offsetY: -6, alpha: 0.22, width: 0.68 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const hash2 = (x: number, y: number) => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export default function EdgeLattice() {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const interactionRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const baseCanvas = baseRef.current;
    const interactionCanvas = interactionRef.current;
    if (!baseCanvas || !interactionCanvas) return;

    const baseCtx = baseCanvas.getContext("2d");
    const overlayCtx = interactionCanvas.getContext("2d");
    if (!baseCtx || !overlayCtx) return;

    baseCtx.lineCap = "round";
    baseCtx.lineJoin = "round";
    overlayCtx.lineCap = "round";
    overlayCtx.lineJoin = "round";

    const wideEnough = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer: PointerState = { x: -1000, y: -1000, active: false };
    const impulses: Impulse[] = [];

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let resizeTimer = 0;
    let lastDirty: { x: number; y: number; w: number; h: number } | null = null;

    const pageHeight = () => Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.clientHeight,
      window.innerHeight,
    );

    const edgeBand = () => Math.min(500, Math.max(330, width * 0.29));
    const transitionAt = (x: number) => clamp(Math.min(x, width - x) / edgeBand(), 0, 1);
    const localCellScale = (x: number) => 50 - 39 * smoothstep(0.04, 0.98, transitionAt(x));

    const interactionStrength = (x: number, y: number, now: number) => {
      let hover = 0;
      if (pointer.active) {
        const distance = Math.hypot(pointer.x - x, pointer.y - y);
        const radial = 1 - smoothstep(0, HOVER_RADIUS, distance);
        hover = radial * radial * 0.72;
      }

      let click = 0;
      for (const impulse of impulses) {
        const age = now - impulse.t;
        if (age > CLICK_DURATION) continue;
        const distance = Math.hypot(impulse.x - x, impulse.y - y);
        const spatial = 1 - smoothstep(0, CLICK_RADIUS, distance);
        const temporal = 1 - smoothstep(0, CLICK_DURATION, age);
        click = Math.max(click, spatial * spatial * temporal);
      }
      return { hover, click };
    };

    const gyroid = (x: number, y: number, phase: number, now = 0, interactive = false) => {
      const scale = localCellScale(x);
      const baseFrequency = (Math.PI * 2) / Math.max(8, scale * 2.55);
      const interaction = interactive ? interactionStrength(x, y, now) : { hover: 0, click: 0 };
      const frequency = baseFrequency * (1 + interaction.hover * 0.1 + interaction.click * 0.68);
      const sx = x * frequency + phase + interaction.click * 1.35;
      const sy = y * frequency * 0.91 - phase * 0.56 - interaction.hover * 0.035;
      const sz = x * frequency * 0.48 - y * frequency * 0.27 + phase * 1.04 + interaction.click * 1.75;

      return (
        Math.sin(sx) * Math.cos(sy) +
        Math.sin(sy) * Math.cos(sz) +
        Math.sin(sz) * Math.cos(sx)
      );
    };

    const lerpEdge = (a: Point, b: Point, valueA: number, valueB: number, iso: number): Point => {
      const denominator = valueB - valueA;
      const t = Math.abs(denominator) < 1e-6 ? 0.5 : (iso - valueA) / denominator;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    };

    const contourSegments = (
      corners: [Point, Point, Point, Point],
      values: [number, number, number, number],
      iso: number,
    ): [Point, Point][] => {
      const [topLeft, topRight, bottomRight, bottomLeft] = corners;
      const [v0, v1, v2, v3] = values;
      const hits: { edge: string; point: Point }[] = [];

      if ((v0 < iso) !== (v1 < iso)) hits.push({ edge: "top", point: lerpEdge(topLeft, topRight, v0, v1, iso) });
      if ((v1 < iso) !== (v2 < iso)) hits.push({ edge: "right", point: lerpEdge(topRight, bottomRight, v1, v2, iso) });
      if ((v2 < iso) !== (v3 < iso)) hits.push({ edge: "bottom", point: lerpEdge(bottomRight, bottomLeft, v2, v3, iso) });
      if ((v3 < iso) !== (v0 < iso)) hits.push({ edge: "left", point: lerpEdge(bottomLeft, topLeft, v3, v0, iso) });

      if (hits.length === 2) return [[hits[0].point, hits[1].point]];
      if (hits.length !== 4) return [];

      const center = (v0 + v1 + v2 + v3) * 0.25;
      const top = hits.find((entry) => entry.edge === "top")?.point;
      const right = hits.find((entry) => entry.edge === "right")?.point;
      const bottom = hits.find((entry) => entry.edge === "bottom")?.point;
      const left = hits.find((entry) => entry.edge === "left")?.point;
      if (!top || !right || !bottom || !left) return [];

      return center >= iso ? [[top, left], [right, bottom]] : [[top, right], [bottom, left]];
    };

    const drawSegmentOrDot = (
      ctx: CanvasRenderingContext2D,
      start: Point,
      end: Point,
      transition: number,
      alpha: number,
      lineWidth: number,
      seedX: number,
      seedY: number,
    ) => {
      const midpoint = { x: (start.x + end.x) * 0.5, y: (start.y + end.y) * 0.5 };
      const shrink = 1 - smoothstep(0.42, 0.92, transition);

      if (transition > 0.6) {
        const keepChance = 0.7 - smoothstep(0.6, 1, transition) * 0.52;
        if (hash2(seedX, seedY) > keepChance) return;
        const radius = 0.38 + (1 - transition) * 0.42;
        ctx.beginPath();
        ctx.arc(midpoint.x, midpoint.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(158, 226, 255, ${alpha * (0.34 + (1 - transition) * 0.36)})`;
        ctx.fill();
        return;
      }

      const a = {
        x: midpoint.x + (start.x - midpoint.x) * shrink,
        y: midpoint.y + (start.y - midpoint.y) * shrink,
      };
      const b = {
        x: midpoint.x + (end.x - midpoint.x) * shrink,
        y: midpoint.y + (end.y - midpoint.y) * shrink,
      };
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy) || 1;
      const curve = Math.min(3.2, length * 0.14) * (0.35 + hash2(seedX + 11, seedY + 7) * 0.65);
      const control = {
        x: midpoint.x - (dy / length) * curve,
        y: midpoint.y + (dx / length) * curve,
      };

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(control.x, control.y, b.x, b.y);
      ctx.strokeStyle = `rgba(119, 222, 248, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    const drawBand = (
      ctx: CanvasRenderingContext2D,
      minX: number,
      minY: number,
      maxX: number,
      maxY: number,
      now = 0,
      interactive = false,
    ) => {
      if (!wideEnough.matches) return;

      const band = edgeBand();
      const yStart = Math.max(56, minY);
      const yEnd = Math.min(height - 72, maxY);
      const ranges: [number, number][] = [];
      if (minX < band) ranges.push([Math.max(0, minX), Math.min(band, maxX)]);
      if (maxX > width - band) ranges.push([Math.max(width - band, minX), Math.min(width, maxX)]);

      for (const [rangeStart, rangeEnd] of ranges) {
        const startX = Math.floor(rangeStart / SAMPLE_STEP) * SAMPLE_STEP;
        const startY = Math.floor(yStart / SAMPLE_STEP) * SAMPLE_STEP;

        for (let y = startY; y < yEnd; y += SAMPLE_STEP) {
          for (let x = startX; x < rangeEnd; x += SAMPLE_STEP) {
            const centerX = x + SAMPLE_STEP * 0.5;
            const centerY = y + SAMPLE_STEP * 0.5;
            const transition = transitionAt(centerX);
            const interaction = interactive ? interactionStrength(centerX, centerY, now) : { hover: 0, click: 0 };
            const baseLayers = transition < 0.38 ? 3 : transition < 0.64 ? 2 : 1;
            const forceAllClickLayers = interactive && interaction.click > 0.035;
            const activeLayers = forceAllClickLayers ? 3 : interactive && interaction.hover > 0.01 ? 1 : baseLayers;
            const activeIsos = transition < 0.62 ? ISOS : [0.16];

            for (let layerIndex = 0; layerIndex < activeLayers; layerIndex += 1) {
              const layer = LAYERS[layerIndex];
              const topLeft = { x: x + layer.offsetX, y: y + layer.offsetY };
              const topRight = { x: Math.min(x + SAMPLE_STEP, width) + layer.offsetX, y: y + layer.offsetY };
              const bottomRight = { x: Math.min(x + SAMPLE_STEP, width) + layer.offsetX, y: Math.min(y + SAMPLE_STEP, yEnd) + layer.offsetY };
              const bottomLeft = { x: x + layer.offsetX, y: Math.min(y + SAMPLE_STEP, yEnd) + layer.offsetY };
              const values: [number, number, number, number] = [
                gyroid(topLeft.x, topLeft.y, layer.phase, now, interactive),
                gyroid(topRight.x, topRight.y, layer.phase, now, interactive),
                gyroid(bottomRight.x, bottomRight.y, layer.phase, now, interactive),
                gyroid(bottomLeft.x, bottomLeft.y, layer.phase, now, interactive),
              ];

              const edgePresence = 1 - smoothstep(0.18, 1, transition);
              const interactionBoost = 1 + interaction.hover * 0.08 + interaction.click * 0.62;

              for (const iso of activeIsos) {
                const isoWeight = 1 - Math.min(1, Math.abs(iso) / 0.9);
                const alpha =
                  (0.03 + edgePresence * 0.115) *
                  layer.alpha *
                  (0.72 + isoWeight * 0.28) *
                  interactionBoost;
                const lineWidth = (0.58 + edgePresence * 0.9 + isoWeight * 0.32) * layer.width;
                const segments = contourSegments([topLeft, topRight, bottomRight, bottomLeft], values, iso);

                for (let index = 0; index < segments.length; index += 1) {
                  const [start, end] = segments[index];
                  drawSegmentOrDot(
                    ctx,
                    start,
                    end,
                    transition,
                    alpha,
                    lineWidth,
                    x + layerIndex * 19 + index * 37,
                    y + layerIndex * 29 + index * 17,
                  );
                }
              }
            }
          }
        }
      }
    };

    const renderBase = () => {
      baseCtx.clearRect(0, 0, width, height);
      drawBand(baseCtx, 0, 0, width, height, 0, false);
    };

    const sizeCanvases = () => {
      width = document.documentElement.clientWidth;
      height = pageHeight();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.05);

      for (const canvas of [baseCanvas, interactionCanvas]) {
        canvas.width = Math.max(1, Math.round(width * pixelRatio));
        canvas.height = Math.max(1, Math.round(height * pixelRatio));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      baseCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      overlayCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      baseCtx.lineCap = "round";
      baseCtx.lineJoin = "round";
      overlayCtx.lineCap = "round";
      overlayCtx.lineJoin = "round";
      renderBase();
      overlayCtx.clearRect(0, 0, width, height);
      lastDirty = null;
    };

    const dirtyRectFor = (x: number, y: number, radius: number) => ({
      x: Math.max(0, x - radius - 14),
      y: Math.max(0, y - radius - 14),
      w: Math.min(width, radius * 2 + 28),
      h: Math.min(height, radius * 2 + 28),
    });

    const clearDirty = (rect: { x: number; y: number; w: number; h: number } | null) => {
      if (rect) overlayCtx.clearRect(rect.x, rect.y, rect.w, rect.h);
    };

    const renderInteraction = (now = performance.now()) => {
      frame = 0;
      const active = impulses.filter((impulse) => now - impulse.t < CLICK_DURATION);
      impulses.splice(0, impulses.length, ...active);

      let centerX = pointer.x;
      let centerY = pointer.y;
      let radius = pointer.active ? HOVER_RADIUS : 0;
      if (impulses.length > 0) {
        const latest = impulses[impulses.length - 1];
        centerX = latest.x;
        centerY = latest.y;
        radius = CLICK_RADIUS;
      }

      const nextDirty = radius > 0 ? dirtyRectFor(centerX, centerY, radius) : null;
      clearDirty(lastDirty);
      clearDirty(nextDirty);

      if (nextDirty && Math.min(centerX, width - centerX) <= edgeBand() + radius) {
        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        overlayCtx.clip();

        drawBand(
          overlayCtx,
          nextDirty.x,
          nextDirty.y,
          nextDirty.x + nextDirty.w,
          nextDirty.y + nextDirty.h,
          now,
          true,
        );
        overlayCtx.restore();
      }

      lastDirty = nextDirty;
      if (!reducedMotion.matches && impulses.length > 0) {
        frame = window.requestAnimationFrame(renderInteraction);
      }
    };

    const requestInteraction = () => {
      if (!frame) frame = window.requestAnimationFrame(renderInteraction);
    };

    let lastHoverDraw = 0;
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.pageX;
      pointer.y = event.pageY;
      pointer.active = true;
      const now = performance.now();
      if (now - lastHoverDraw > 54) {
        lastHoverDraw = now;
        requestInteraction();
      }
    };

    const leave = () => {
      pointer.active = false;
      requestInteraction();
    };

    const click = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, summary, [role='button']")) return;
      impulses.push({ x: event.pageX, y: event.pageY, t: performance.now() });
      if (impulses.length > 2) impulses.shift();
      requestInteraction();
    };

    const scheduleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(sizeCanvases, 120);
    };

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleResize) : null;
    resizeObserver?.observe(document.body);
    window.addEventListener("resize", scheduleResize);
    window.visualViewport?.addEventListener("resize", scheduleResize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);

    sizeCanvases();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
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
        .edge-lattice-layer {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          z-index: -1;
          display: block;
          width: 100% !important;
          height: auto;
          max-width: none !important;
          pointer-events: none;
          mask-image: none !important;
          -webkit-mask-image: none !important;
        }
        .edge-lattice-base { opacity: .9; }
        .edge-lattice-interaction { opacity: .68; }
        @media (max-width: 819px) {
          .edge-lattice-layer { display: none !important; }
        }
      `}</style>
      <canvas ref={baseRef} className="edge-lattice edge-lattice-layer edge-lattice-base" aria-hidden="true" />
      <canvas ref={interactionRef} className="edge-lattice-layer edge-lattice-interaction" aria-hidden="true" />
    </>
  );
}
