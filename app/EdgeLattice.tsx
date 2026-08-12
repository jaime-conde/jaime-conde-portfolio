"use client";

import { useEffect, useRef } from "react";

type LoadPulse = { x: number; y: number; startedAt: number; radius: number; strength: number };
type FieldPoint = { x: number; y: number; hoverEnergy: number; loadEnergy: number };
type Rect = { x: number; y: number; w: number; h: number };

const MIN_WIDTH = 820;
const GRID_SPACING = 31;
const DEPTH_LAYERS = 3;
const PULSE_DURATION = 1200;
const MAX_PULSES = 3;
const HOVER_MIN = 72;
const HOVER_MAX = 220;
const CLICK_MIN = 88;
const CLICK_MAX = 190;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (row: number, column: number, type: number, layer: number) => {
  const value = Math.sin(row * 12.9898 + column * 78.233 + type * 37.719 + layer * 19.193) * 43758.5453;
  return value - Math.floor(value);
};
const contourColor = (intensity: number, alpha: number) => {
  const stops = [[64,139,255],[56,224,232],[73,224,151],[255,216,74],[255,86,72]];
  const scaled = Math.min(0.999, intensity) * (stops.length - 1);
  const index = Math.floor(scaled);
  const mix = scaled - index;
  const from = stops[index];
  const to = stops[Math.min(index + 1, stops.length - 1)];
  const c = (i: number) => Math.round(from[i] + (to[i] - from[i]) * mix);
  return `rgba(${c(0)}, ${c(1)}, ${c(2)}, ${alpha})`;
};

export default function EdgeLattice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wideEnough = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const baseCanvas = document.createElement("canvas");
    const baseCtx = baseCanvas.getContext("2d");
    if (!baseCtx) return;

    const pointer = { x: -1000, y: -1000, active: false };
    const pulses: LoadPulse[] = [];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let resizeTimer = 0;
    let hoverTimer = 0;
    let lastDirty: Rect | null = null;

    document.body.classList.add("unified-field-active");

    const documentHeight = () => Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.clientHeight,
      window.innerHeight,
    );
    const edgeBand = () => Math.min(470, Math.max(300, width * 0.27));
    const connectionStrength = (x: number) => {
      const distanceToEdge = Math.min(x, width - x);
      return 1 - smoothstep(edgeBand() * 0.12, edgeBand(), distanceToEdge);
    };
    const edgeInfluence = (x: number) => {
      const distanceToEdge = Math.min(x, width - x);
      return 1 - smoothstep(width * 0.12, width * 0.46, distanceToEdge);
    };
    const hoverRadiusAt = (x: number) => lerp(HOVER_MIN, HOVER_MAX, edgeInfluence(x));
    const clickRadiusAt = (x: number) => lerp(CLICK_MIN, CLICK_MAX, edgeInfluence(x));
    const interactionScaleAt = (x: number) => lerp(0.5, 1, edgeInfluence(x));
    const clickStrengthAt = (x: number) => lerp(0.88, 1, edgeInfluence(x));
    const hoverEnabledAt = (x: number) => edgeInfluence(x) > 0.28;

    const pulseResponse = (x: number, y: number, now: number) => {
      let offsetX = 0;
      let offsetY = 0;
      let peakIntensity = 0;
      for (const pulse of pulses) {
        const age = (now - pulse.startedAt) / PULSE_DURATION;
        if (age < 0 || age > 1) continue;
        const dx = x - pulse.x;
        const dy = y - pulse.y;
        const distance = Math.hypot(dx, dy);
        if (distance > pulse.radius) continue;
        const spatial = Math.pow(1 - distance / pulse.radius, 2);
        const envelope = Math.sin(Math.PI * age) * Math.exp(-1.45 * age);
        const response = spatial * envelope * pulse.strength;
        const directionX = distance > 0.5 ? dx / distance : 0;
        const directionY = distance > 0.5 ? dy / distance : 0;
        const localScale = interactionScaleAt(x);
        offsetX += directionX * response * 22 * localScale;
        offsetY += directionY * response * 22 * localScale;
        peakIntensity = Math.max(peakIntensity, Math.min(1, response * 1.5));
      }
      return { offsetX, offsetY, peakIntensity };
    };

    const pointAt = (row: number, column: number, layer: number, now: number, interactive: boolean): FieldPoint => {
      const depth = layer / Math.max(1, DEPTH_LAYERS - 1);
      const baseX = GRID_SPACING / 2 + column * GRID_SPACING + depth * 8;
      const baseY = GRID_SPACING / 2 + row * GRID_SPACING - depth * 6;
      let hoverEnergy = 0;
      let hoverOffsetX = 0;
      let hoverOffsetY = 0;
      if (interactive && pointer.active && hoverEnabledAt(pointer.x)) {
        const radius = hoverRadiusAt(pointer.x);
        const distance = Math.hypot(pointer.x - baseX, pointer.y - baseY);
        const influence = Math.max(0, 1 - distance / radius);
        hoverEnergy = influence * influence * (3 - 2 * influence);
        const localScale = interactionScaleAt(baseX);
        hoverOffsetX = distance > 0.5 ? ((baseX - pointer.x) / distance) * hoverEnergy * 13 * localScale : 0;
        hoverOffsetY = distance > 0.5 ? ((baseY - pointer.y) / distance) * hoverEnergy * 13 * localScale : 0;
      }
      const load = interactive ? pulseResponse(baseX, baseY, now) : { offsetX: 0, offsetY: 0, peakIntensity: 0 };
      return {
        x: baseX + hoverOffsetX + load.offsetX,
        y: baseY + hoverOffsetY + load.offsetY,
        hoverEnergy,
        loadEnergy: load.peakIntensity,
      };
    };

    const drawConnection = (
      ctx: CanvasRenderingContext2D,
      from: FieldPoint,
      to: FieldPoint,
      strength: number,
      layer: number,
      diagonal: boolean,
      interactive: boolean,
    ) => {
      const hoverEnergy = interactive ? Math.max(from.hoverEnergy, to.hoverEnergy) : 0;
      const loadEnergy = interactive ? Math.max(from.loadEnergy, to.loadEnergy) : 0;
      const layerFade = 1 - layer * 0.26;
      const baseAlpha = (diagonal ? 0.055 : 0.085) * strength * layerFade;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = loadEnergy > 0.015
        ? contourColor(loadEnergy, (0.2 + loadEnergy * 0.55) * strength * layerFade)
        : hoverEnergy > 0.015
          ? `rgba(102, 226, 255, ${(0.09 + hoverEnergy * 0.28) * strength * layerFade})`
          : `rgba(105, 174, 207, ${baseAlpha})`;
      ctx.lineWidth = (diagonal ? 0.48 : 0.66) + hoverEnergy * 0.7 + loadEnergy;
      ctx.stroke();
    };

    const drawRegion = (
      ctx: CanvasRenderingContext2D,
      minY: number,
      maxY: number,
      now: number,
      interactive: boolean,
    ) => {
      const startRow = Math.max(0, Math.floor((minY - GRID_SPACING * 2) / GRID_SPACING));
      const endRow = Math.min(Math.ceil(height / GRID_SPACING) + 1, Math.ceil((maxY + GRID_SPACING * 2) / GRID_SPACING));
      const columns = Math.ceil(width / GRID_SPACING) + 1;

      if (wideEnough.matches) {
        for (let layer = DEPTH_LAYERS - 1; layer >= 0; layer -= 1) {
          const points: FieldPoint[][] = [];
          for (let row = startRow; row <= endRow; row += 1) {
            const rowPoints: FieldPoint[] = [];
            for (let column = 0; column < columns; column += 1) rowPoints.push(pointAt(row, column, layer, now, interactive));
            points.push(rowPoints);
          }
          for (let localRow = 0; localRow < points.length; localRow += 1) {
            const row = startRow + localRow;
            for (let column = 0; column < columns; column += 1) {
              const point = points[localRow][column];
              const strength = connectionStrength(point.x);
              if (strength <= 0.015) continue;
              const probability = Math.pow(strength, 1.25);
              const layerPenalty = layer * 0.09;
              if (column + 1 < columns && hash(row, column, 0, layer) < probability - layerPenalty)
                drawConnection(ctx, point, points[localRow][column + 1], strength, layer, false, interactive);
              if (localRow + 1 < points.length && hash(row, column, 1, layer) < probability * 0.92 - layerPenalty)
                drawConnection(ctx, point, points[localRow + 1][column], strength, layer, false, interactive);
              if (localRow + 1 < points.length && column + 1 < columns && hash(row, column, 2, layer) < probability * 0.72 - layerPenalty) {
                const target = (row + column + layer) % 2 === 0 ? points[localRow + 1][column + 1] : points[localRow + 1][column];
                drawConnection(ctx, point, target, strength, layer, true, interactive);
              }
            }
          }
        }
      }

      for (let row = startRow; row <= endRow; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const point = pointAt(row, column, 0, now, interactive);
          const strength = connectionStrength(point.x);
          const dotBlend = 1 - strength;
          const dotRadius = 0.58 + point.hoverEnergy * 1.25 + point.loadEnergy * 2 + strength * 0.18;
          const idleAlpha = 0.16 + dotBlend * 0.05;
          ctx.beginPath();
          ctx.arc(point.x, point.y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = point.loadEnergy > 0.015
            ? contourColor(point.loadEnergy, 0.34 + point.loadEnergy * 0.5)
            : point.hoverEnergy > 0.015
              ? `rgba(151, 238, 255, ${0.22 + point.hoverEnergy * 0.42})`
              : `rgba(175, 222, 255, ${idleAlpha})`;
          ctx.fill();
        }
      }
    };

    const buildBase = () => {
      baseCtx.clearRect(0, 0, width, height);
      drawRegion(baseCtx, 0, height, 0, false);
      context.clearRect(0, 0, width, height);
      context.drawImage(baseCanvas, 0, 0, width, height);
      lastDirty = null;
    };

    const sizeCanvases = () => {
      width = document.documentElement.clientWidth;
      height = documentHeight();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.05);
      for (const target of [canvas, baseCanvas]) {
        target.width = Math.max(1, Math.round(width * pixelRatio));
        target.height = Math.max(1, Math.round(height * pixelRatio));
      }
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      baseCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      buildBase();
    };

    const rectFor = (x: number, y: number, radius: number): Rect => ({
      x: Math.max(0, x - radius - 50),
      y: Math.max(0, y - radius - 50),
      w: Math.min(width, radius * 2 + 100),
      h: Math.min(height, radius * 2 + 100),
    });
    const union = (a: Rect | null, b: Rect | null): Rect | null => {
      if (!a) return b;
      if (!b) return a;
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const right = Math.max(a.x + a.w, b.x + b.w);
      const bottom = Math.max(a.y + a.h, b.y + b.h);
      return { x, y, w: right - x, h: bottom - y };
    };
    const restoreRect = (rect: Rect | null) => {
      if (!rect) return;
      context.clearRect(rect.x, rect.y, rect.w, rect.h);
      context.drawImage(
        baseCanvas,
        rect.x * pixelRatio, rect.y * pixelRatio, rect.w * pixelRatio, rect.h * pixelRatio,
        rect.x, rect.y, rect.w, rect.h,
      );
    };

    const currentDirty = () => {
      let dirty: Rect | null =
        pointer.active && hoverEnabledAt(pointer.x)
          ? rectFor(pointer.x, pointer.y, hoverRadiusAt(pointer.x))
          : null;
      for (const pulse of pulses) dirty = union(dirty, rectFor(pulse.x, pulse.y, pulse.radius));
      return dirty;
    };

    const renderInteraction = (now = performance.now()) => {
      frame = 0;
      for (let i = pulses.length - 1; i >= 0; i -= 1) {
        if (now - pulses[i].startedAt > PULSE_DURATION) pulses.splice(i, 1);
      }
      const nextDirty = currentDirty();
      const repaint = union(lastDirty, nextDirty);
      restoreRect(repaint);
      if (nextDirty) {
        context.save();
        context.beginPath();
        context.rect(nextDirty.x, nextDirty.y, nextDirty.w, nextDirty.h);
        context.clip();
        drawRegion(context, nextDirty.y, nextDirty.y + nextDirty.h, now, true);
        context.restore();
      }
      lastDirty = nextDirty;
      if (!reducedMotion.matches && pulses.length > 0) frame = window.requestAnimationFrame(renderInteraction);
    };
    const requestInteraction = () => {
      if (!frame) frame = window.requestAnimationFrame(renderInteraction);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;

      const nextX = event.pageX;
      const nextY = event.pageY;
      const nextHoverActive = hoverEnabledAt(nextX);
      const hoverStateChanged = pointer.active !== nextHoverActive;

      pointer.x = nextX;
      pointer.y = nextY;
      pointer.active = nextHoverActive;

      const now = performance.now();
      if (hoverStateChanged) {
        requestInteraction();
        return;
      }
      if (nextHoverActive && now - hoverTimer > 42) {
        hoverTimer = now;
        requestInteraction();
      }
    };
    const leave = () => {
      pointer.active = false;
      requestInteraction();
    };
    const applyLoad = (event: PointerEvent) => {
      if (event.button !== 0 || reducedMotion.matches) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, summary, [role='button']")) return;
      const x = event.pageX;
      const radius = clickRadiusAt(x);
      pulses.push({ x, y: event.pageY, startedAt: performance.now(), radius, strength: clickStrengthAt(x) });
      if (pulses.length > MAX_PULSES) pulses.shift();
      requestInteraction();
    };
    const scheduleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(sizeCanvases, 140);
    };

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleResize) : null;
    resizeObserver?.observe(document.body);
    sizeCanvases();
    window.addEventListener("resize", scheduleResize);
    window.visualViewport?.addEventListener("resize", scheduleResize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", applyLoad, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);

    return () => {
      document.body.classList.remove("unified-field-active");
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.visualViewport?.removeEventListener("resize", scheduleResize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", applyLoad);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <>
      <style>{`
        body.unified-field-active::before { opacity: 0 !important; }
        .edge-lattice {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: auto !important;
          bottom: auto !important;
          z-index: -1;
          width: 100% !important;
          height: auto;
          max-width: none !important;
          pointer-events: none;
          opacity: .9;
          mask-image: none !important;
          -webkit-mask-image: none !important;
        }
      `}</style>
      <canvas ref={canvasRef} className="edge-lattice" aria-hidden="true" />
    </>
  );
}
