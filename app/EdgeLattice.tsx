"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type PointerState = { x: number; y: number; active: boolean };
type Impulse = { x: number; y: number; t: number };
type Layer = {
  offsetX: number;
  offsetY: number;
  alpha: number;
  width: number;
  skew: number;
};

const MIN_WIDTH = 820;
const HOVER_RADIUS = 150;
const CLICK_RADIUS = 185;
const CLICK_DURATION = 820;

const LAYERS: Layer[] = [
  { offsetX: 0, offsetY: 0, alpha: 1, width: 1, skew: 0 },
  { offsetX: 6, offsetY: -5, alpha: 0.38, width: 0.8, skew: 0.08 },
  { offsetX: 11, offsetY: -9, alpha: 0.18, width: 0.62, skew: -0.06 },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

    const edgeBand = () => Math.min(450, Math.max(300, width * 0.27));

    const transitionAt = (x: number) =>
      clamp(Math.min(x, width - x) / edgeBand(), 0, 1);

    const cellSizeAt = (x: number) => {
      const t = transitionAt(x);
      return lerp(42, 9, smoothstep(0.03, 0.96, t));
    };

    const interactionStrength = (x: number, y: number, now: number) => {
      let hover = 0;

      if (pointer.active) {
        const distance = Math.hypot(pointer.x - x, pointer.y - y);
        const radial = 1 - smoothstep(0, HOVER_RADIUS, distance);
        hover = radial * radial;
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

    const drawDiamond = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      halfW: number,
      halfH: number,
      alpha: number,
      lineWidth: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - halfH);
      ctx.lineTo(cx + halfW, cy);
      ctx.lineTo(cx, cy + halfH);
      ctx.lineTo(cx - halfW, cy);
      ctx.closePath();
      ctx.strokeStyle = `rgba(119, 222, 248, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    const drawInnerDiamond = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      halfW: number,
      halfH: number,
      alpha: number,
      lineWidth: number,
    ) => {
      const inset = 0.62;
      ctx.beginPath();
      ctx.moveTo(cx, cy - halfH * inset);
      ctx.lineTo(cx + halfW * inset, cy);
      ctx.lineTo(cx, cy + halfH * inset);
      ctx.lineTo(cx - halfW * inset, cy);
      ctx.closePath();
      ctx.strokeStyle = `rgba(119, 222, 248, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    const drawDot = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      alpha: number,
    ) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(158, 226, 255, ${alpha})`;
      ctx.fill();
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

      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      const band = edgeBand();
      const yStart = Math.max(56, minY);
      const yEnd = Math.min(height - 72, maxY);

      const ranges: [number, number][] = [];
      if (minX < band) ranges.push([Math.max(0, minX), Math.min(band, maxX)]);
      if (maxX > width - band) {
        ranges.push([Math.max(width - band, minX), Math.min(width, maxX)]);
      }

      for (const [rangeStart, rangeEnd] of ranges) {
        for (let x = rangeStart; x < rangeEnd; ) {
          const cell = cellSizeAt(x);
          const stepX = Math.max(10, cell);
          const stepY = Math.max(10, cell * 0.86);

          for (let y = yStart; y < yEnd; y += stepY) {
            const rowOffset = Math.floor(y / stepY) % 2 === 0 ? 0 : stepX * 0.5;

            for (let xi = x + rowOffset; xi < rangeEnd; xi += stepX) {
              const cx = xi + stepX * 0.5;
              const cy = y + stepY * 0.5;

              const transition = transitionAt(cx);
              const interaction = interactive
                ? interactionStrength(cx, cy, now)
                : { hover: 0, click: 0 };

              const allLayersOnClick = interaction.click > 0.06;
              const layerCount = allLayersOnClick
                ? 3
                : transition < 0.36
                  ? 3
                  : transition < 0.66
                    ? 2
                    : 1;

              const densityBoost = 1 + interaction.hover * 0.16 + interaction.click * 0.72;
              const compressed = cell / densityBoost;

              for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
                const layer = LAYERS[layerIndex];

                const localX = cx + layer.offsetX;
                const localY = cy + layer.offsetY;
                const t = transitionAt(localX);

                const halfW = compressed * (0.46 + layer.skew);
                const halfH = compressed * (0.34 - layer.skew * 0.25);

                const edgePresence = 1 - smoothstep(0.24, 1, t);
                const blendToDots = smoothstep(0.5, 0.96, t);

                const alphaBase =
                  (0.035 + edgePresence * 0.12) *
                  layer.alpha *
                  (1 + interaction.hover * 0.12 + interaction.click * 0.82);

                const lineWidth =
                  (0.6 + edgePresence * 1.05) *
                  layer.width *
                  (1 + interaction.click * 0.2);

                // outer diamond survives longer
                if (blendToDots < 0.92) {
                  const segmentShrink = 1 - smoothstep(0.52, 0.9, t);
                  drawDiamond(
                    ctx,
                    localX,
                    localY,
                    halfW * segmentShrink,
                    halfH * segmentShrink,
                    alphaBase,
                    lineWidth,
                  );

                  if (t < 0.7) {
                    drawInnerDiamond(
                      ctx,
                      localX,
                      localY,
                      halfW * 0.9 * segmentShrink,
                      halfH * 0.9 * segmentShrink,
                      alphaBase * 0.45,
                      Math.max(0.45, lineWidth * 0.7),
                    );
                  }
                }

                // gradual collapse into dots
                if (blendToDots > 0.3) {
                  const keepChance = 0.78 - blendToDots * 0.42;
                  if (hash2(localX + layerIndex * 11, localY + layerIndex * 19) < keepChance) {
                    const dotAlpha =
                      alphaBase * (0.2 + blendToDots * 0.7) * (0.7 + interaction.click * 0.35);
                    const dotRadius =
                      0.42 + (1 - t) * 0.4 + interaction.click * 0.28;

                    drawDot(ctx, localX, localY, dotRadius, dotAlpha);
                  }
                }
              }
            }
          }

          x += Math.max(18, cellSizeAt(x) * 0.72);
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
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.15);

      for (const canvas of [baseCanvas, interactionCanvas]) {
        canvas.width = Math.max(1, Math.round(width * pixelRatio));
        canvas.height = Math.max(1, Math.round(height * pixelRatio));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      baseCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      overlayCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      renderBase();
      overlayCtx.clearRect(0, 0, width, height);
      lastDirty = null;
    };

    const dirtyRectFor = (x: number, y: number, radius: number) => ({
      x: Math.max(0, x - radius - 20),
      y: Math.max(0, y - radius - 20),
      w: Math.min(width, radius * 2 + 40),
      h: Math.min(height, radius * 2 + 40),
    });

    const clearDirty = (rect: { x: number; y: number; w: number; h: number } | null) => {
      if (rect) overlayCtx.clearRect(rect.x, rect.y, rect.w, rect.h);
    };

    const renderInteraction = (now = performance.now()) => {
      frame = 0;

      const activeImpulses = impulses.filter(
        (impulse) => now - impulse.t < CLICK_DURATION,
      );
      impulses.splice(0, impulses.length, ...activeImpulses);

      let centerX = pointer.x;
      let centerY = pointer.y;
      let radius = pointer.active ? HOVER_RADIUS : 0;

      for (const impulse of impulses) {
        centerX = impulse.x;
        centerY = impulse.y;
        radius = Math.max(radius, CLICK_RADIUS);
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
      if (now - lastHoverDraw > 56) {
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
      if (target?.closest("a, button, input, textarea, select, summary, [role='button']")) {
        return;
      }

      impulses.push({
        x: event.pageX,
        y: event.pageY,
        t: performance.now(),
      });

      if (impulses.length > 3) impulses.shift();
      requestInteraction();
    };

    const scheduleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(sizeCanvases, 120);
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
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
        .edge-lattice-base { opacity: .92; }
        .edge-lattice-interaction { opacity: .95; }
        @media (max-width: 819px) {
          .edge-lattice-layer { display: none !important; }
        }
      `}</style>

      <canvas
        ref={baseRef}
        className="edge-lattice edge-lattice-layer edge-lattice-base"
        aria-hidden="true"
      />
      <canvas
        ref={interactionRef}
        className="edge-lattice-layer edge-lattice-interaction"
        aria-hidden="true"
      />
    </>
  );
}
