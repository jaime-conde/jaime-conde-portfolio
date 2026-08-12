"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Impulse = { x: number; y: number; t: number };
type PointerState = { x: number; y: number; active: boolean };

type Layer = {
  phase: number;
  offsetX: number;
  offsetY: number;
  alpha: number;
  width: number;
};

const MIN_WIDTH = 820;
const TOP_PAD = 52;
const BOTTOM_PAD = 72;
const BASE_STEP = 28;
const INTERACTION_RADIUS = 280;
const CLICK_RADIUS = 360;
const CLICK_DURATION = 900;
const ISOS = [-0.54, 0.1, 0.66];
const LAYERS: Layer[] = [
  { phase: 0, offsetX: 0, offsetY: 0, alpha: 1, width: 1 },
  { phase: 1.18, offsetX: 6, offsetY: -4, alpha: 0.45, width: 0.82 },
  { phase: 2.22, offsetX: 11, offsetY: -8, alpha: 0.24, width: 0.68 },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export default function EdgeLattice() {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const interactionRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const baseCanvas = baseRef.current;
    const interactionCanvas = interactionRef.current;
    if (!baseCanvas || !interactionCanvas) return;

    const base = baseCanvas.getContext("2d");
    const overlay = interactionCanvas.getContext("2d");
    if (!base || !overlay) return;

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

    const pageHeight = () =>
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.clientHeight,
        window.innerHeight,
      );

    const sizeCanvases = () => {
      width = document.documentElement.clientWidth;
      height = pageHeight();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.15);

      for (const canvas of [baseCanvas, interactionCanvas]) {
        canvas.width = Math.max(1, Math.round(width * pixelRatio));
        canvas.height = Math.max(1, Math.round(height * pixelRatio));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      base.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      overlay.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      renderBase();
      overlay.clearRect(0, 0, width, height);
      lastDirty = null;
    };

    const edgeDistanceAt = (x: number) => Math.min(x, width - x);
    const halfWidth = () => Math.max(1, width * 0.5);

    const transitionAt = (x: number) => {
      const normalized = clamp(edgeDistanceAt(x) / halfWidth(), 0, 1);
      return smoothstep(0.08, 0.94, normalized);
    };

    const localScaleAt = (x: number) => {
      const transition = transitionAt(x);
      return 36 - transition * 27;
    };

    const interactionStrength = (x: number, y: number, now: number) => {
      let hover = 0;
      if (pointer.active) {
        const distance = Math.hypot(pointer.x - x, pointer.y - y);
        hover = 1 - smoothstep(0, INTERACTION_RADIUS, distance);
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
      now = 0,
      interactive = false,
    ) => {
      const scale = localScaleAt(x);
      const baseFrequency = Math.PI * 2 / Math.max(6, scale * 2.6);
      const interaction = interactive
        ? interactionStrength(x, y, now)
        : { hover: 0, click: 0 };

      const frequency =
        baseFrequency * (1 + interaction.hover * 0.52 + interaction.click * 1.35);
      const phaseShift = interaction.click * 2.2;

      const sx = x * frequency + phase + phaseShift;
      const sy = y * frequency * 0.94 - phase * 0.58 - interaction.hover * 0.34;
      const sz =
        x * frequency * 0.5 -
        y * frequency * 0.31 +
        phase * 1.08 +
        interaction.click * 2.8;

      return (
        Math.sin(sx) * Math.cos(sy) +
        Math.sin(sy) * Math.cos(sz) +
        Math.sin(sz) * Math.cos(sx)
      );
    };

    const lerpEdge = (
      a: Point,
      b: Point,
      valueA: number,
      valueB: number,
      iso: number,
    ) => {
      const denominator = valueB - valueA;
      const t = Math.abs(denominator) < 1e-6 ? 0.5 : (iso - valueA) / denominator;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      };
    };

    const contourSegments = (
      corners: [Point, Point, Point, Point],
      values: [number, number, number, number],
      iso: number,
    ): [Point, Point][] => {
      const [topLeft, topRight, bottomRight, bottomLeft] = corners;
      const [v0, v1, v2, v3] = values;
      const intersections: { edge: string; point: Point }[] = [];

      if ((v0 < iso && v1 >= iso) || (v0 >= iso && v1 < iso)) {
        intersections.push({ edge: "top", point: lerpEdge(topLeft, topRight, v0, v1, iso) });
      }
      if ((v1 < iso && v2 >= iso) || (v1 >= iso && v2 < iso)) {
        intersections.push({ edge: "right", point: lerpEdge(topRight, bottomRight, v1, v2, iso) });
      }
      if ((v2 < iso && v3 >= iso) || (v2 >= iso && v3 < iso)) {
        intersections.push({ edge: "bottom", point: lerpEdge(bottomRight, bottomLeft, v2, v3, iso) });
      }
      if ((v3 < iso && v0 >= iso) || (v3 >= iso && v0 < iso)) {
        intersections.push({ edge: "left", point: lerpEdge(bottomLeft, topLeft, v3, v0, iso) });
      }

      if (intersections.length === 2) {
        return [[intersections[0].point, intersections[1].point]];
      }

      if (intersections.length === 4) {
        const center = (v0 + v1 + v2 + v3) * 0.25;
        const top = intersections.find((entry) => entry.edge === "top")?.point;
        const right = intersections.find((entry) => entry.edge === "right")?.point;
        const bottom = intersections.find((entry) => entry.edge === "bottom")?.point;
        const left = intersections.find((entry) => entry.edge === "left")?.point;
        if (!top || !right || !bottom || !left) return [];
        return center >= iso
          ? [[top, left], [right, bottom]]
          : [[top, right], [bottom, left]];
      }

      return [];
    };

    const drawShrinkingSegment = (
      context: CanvasRenderingContext2D,
      start: Point,
      end: Point,
      transition: number,
      alpha: number,
      lineWidth: number,
    ) => {
      const midpoint = {
        x: (start.x + end.x) * 0.5,
        y: (start.y + end.y) * 0.5,
      };
      const segmentScale = Math.pow(1 - transition, 1.45);

      if (segmentScale < 0.16) {
        const radius = 0.42 + (1 - transition) * 0.52;
        context.beginPath();
        context.arc(midpoint.x, midpoint.y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(158, 226, 255, ${alpha * (0.48 + transition * 0.4)})`;
        context.fill();
        return;
      }

      const shrunkStart = {
        x: midpoint.x + (start.x - midpoint.x) * segmentScale,
        y: midpoint.y + (start.y - midpoint.y) * segmentScale,
      };
      const shrunkEnd = {
        x: midpoint.x + (end.x - midpoint.x) * segmentScale,
        y: midpoint.y + (end.y - midpoint.y) * segmentScale,
      };

      context.beginPath();
      context.moveTo(shrunkStart.x, shrunkStart.y);
      context.lineTo(shrunkEnd.x, shrunkEnd.y);
      context.strokeStyle = `rgba(119, 222, 248, ${alpha})`;
      context.lineWidth = lineWidth * (0.55 + segmentScale * 0.45);
      context.stroke();
    };

    const drawFieldRegion = (
      context: CanvasRenderingContext2D,
      minX: number,
      minY: number,
      maxX: number,
      maxY: number,
      now = 0,
      interactive = false,
    ) => {
      if (!wideEnough.matches) return;

      const yStart = Math.max(TOP_PAD, minY);
      const yEnd = Math.min(Math.max(TOP_PAD + 160, height - BOTTOM_PAD), maxY);
      const xStart = Math.max(0, minX);
      const xEnd = Math.min(width, maxX);

      for (let y = yStart; y < yEnd; y += BASE_STEP) {
        for (let x = xStart; x < xEnd; x += BASE_STEP) {
          const centerX = x + BASE_STEP * 0.5;
          const transition = transitionAt(centerX);
          const activeLayers = transition > 0.58 ? 1 : transition > 0.34 ? 2 : 3;
          const activeIsos = transition > 0.7 ? [0.1] : ISOS;

          for (let layerIndex = 0; layerIndex < activeLayers; layerIndex += 1) {
            const layer = LAYERS[layerIndex];
            const topLeft = { x: x + layer.offsetX, y: y + layer.offsetY };
            const topRight = {
              x: Math.min(x + BASE_STEP, width) + layer.offsetX,
              y: y + layer.offsetY,
            };
            const bottomRight = {
              x: Math.min(x + BASE_STEP, width) + layer.offsetX,
              y: Math.min(y + BASE_STEP, yEnd) + layer.offsetY,
            };
            const bottomLeft = {
              x: x + layer.offsetX,
              y: Math.min(y + BASE_STEP, yEnd) + layer.offsetY,
            };

            const values: [number, number, number, number] = [
              gyroid(topLeft.x, topLeft.y, layer.phase, now, interactive),
              gyroid(topRight.x, topRight.y, layer.phase, now, interactive),
              gyroid(bottomRight.x, bottomRight.y, layer.phase, now, interactive),
              gyroid(bottomLeft.x, bottomLeft.y, layer.phase, now, interactive),
            ];

            const interaction = interactive
              ? interactionStrength(centerX, y + BASE_STEP * 0.5, now)
              : { hover: 0, click: 0 };
            const edgePresence = 1 - transition * 0.72;
            const interactionBoost = 1 + interaction.hover * 0.5 + interaction.click * 1.15;

            for (const iso of activeIsos) {
              const isoWeight = 1 - Math.min(1, Math.abs(iso) / 0.9);
              const alpha =
                (0.045 + edgePresence * 0.13) *
                layer.alpha *
                (0.7 + isoWeight * 0.3) *
                interactionBoost;
              const lineWidth =
                (0.75 + edgePresence * 1.35 + isoWeight * 0.5) * layer.width;

              for (const [start, end] of contourSegments(
                [topLeft, topRight, bottomRight, bottomLeft],
                values,
                iso,
              )) {
                drawShrinkingSegment(context, start, end, transition, alpha, lineWidth);
              }
            }
          }
        }
      }
    };

    function renderBase() {
      base.clearRect(0, 0, width, height);
      drawFieldRegion(base, 0, 0, width, height, 0, false);
    }

    const dirtyRectFor = (x: number, y: number, radius: number) => ({
      x: Math.max(0, x - radius - 40),
      y: Math.max(0, y - radius - 40),
      w: Math.min(width, radius * 2 + 80),
      h: Math.min(height, radius * 2 + 80),
    });

    const clearDirty = (rect: { x: number; y: number; w: number; h: number } | null) => {
      if (!rect) return;
      overlay.clearRect(rect.x, rect.y, rect.w, rect.h);
    };

    const renderInteraction = (now = performance.now()) => {
      frame = 0;

      const activeImpulses = impulses.filter((impulse) => now - impulse.t < CLICK_DURATION);
      impulses.splice(0, impulses.length, ...activeImpulses);

      let centerX = pointer.x;
      let centerY = pointer.y;
      let radius = pointer.active ? INTERACTION_RADIUS : 0;

      for (const impulse of impulses) {
        centerX = impulse.x;
        centerY = impulse.y;
        radius = Math.max(radius, CLICK_RADIUS);
      }

      const nextDirty = radius > 0 ? dirtyRectFor(centerX, centerY, radius) : null;
      clearDirty(lastDirty);
      clearDirty(nextDirty);

      if (nextDirty) {
        overlay.save();
        overlay.beginPath();
        overlay.rect(nextDirty.x, nextDirty.y, nextDirty.w, nextDirty.h);
        overlay.clip();

        const gradient = overlay.createRadialGradient(
          centerX,
          centerY,
          radius * 0.12,
          centerX,
          centerY,
          radius,
        );
        gradient.addColorStop(0, "rgba(3, 8, 18, 0.42)");
        gradient.addColorStop(0.7, "rgba(3, 8, 18, 0.18)");
        gradient.addColorStop(1, "rgba(3, 8, 18, 0)");
        overlay.fillStyle = gradient;
        overlay.fillRect(nextDirty.x, nextDirty.y, nextDirty.w, nextDirty.h);

        drawFieldRegion(
          overlay,
          nextDirty.x,
          nextDirty.y,
          nextDirty.x + nextDirty.w,
          nextDirty.y + nextDirty.h,
          now,
          true,
        );
        overlay.restore();
      }

      lastDirty = nextDirty;

      if (!reducedMotion.matches && impulses.length > 0) {
        frame = window.requestAnimationFrame(renderInteraction);
      }
    };

    const requestInteractionRender = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(renderInteraction);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.pageX;
      pointer.y = event.pageY;
      pointer.active = true;
      requestInteractionRender();
    };

    const leave = () => {
      pointer.active = false;
      requestInteractionRender();
    };

    const click = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, summary, [role='button']")) return;

      impulses.push({ x: event.pageX, y: event.pageY, t: performance.now() });
      if (impulses.length > 3) impulses.shift();
      requestInteractionRender();
    };

    const scheduleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(sizeCanvases, 120);
    };

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(scheduleResize)
      : null;

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
        .edge-lattice-base,
        .edge-lattice-interaction {
          position: absolute;
          top: 0;
          left: 0;
          z-index: -1;
          display: block;
          width: 100%;
          height: auto;
          max-width: none !important;
          pointer-events: none;
          mask-image: none !important;
          -webkit-mask-image: none !important;
        }
        .edge-lattice-base { opacity: .9; }
        .edge-lattice-interaction { opacity: .98; }
        @media (max-width: 819px) {
          .edge-lattice-base,
          .edge-lattice-interaction { display: none; }
        }
      `}</style>
      <canvas ref={baseRef} className="edge-lattice-base" aria-hidden="true" />
      <canvas ref={interactionRef} className="edge-lattice-interaction" aria-hidden="true" />
    </>
  );
}
