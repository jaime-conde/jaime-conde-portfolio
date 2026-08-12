"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Impulse = { x: number; y: number; t: number };

const MIN_WIDTH = 820;
const FRAME_INTERVAL = 1000 / 30;
const TOP_PAD = 52;
const BOTTOM_PAD = 72;
const ISOS = [-0.62, -0.08, 0.5];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
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

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let lastRendered = -FRAME_INTERVAL;

    const impulses: Impulse[] = [];

    const documentHeight = () =>
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.clientHeight,
        window.innerHeight,
      );

    const resize = () => {
      width = document.documentElement.clientWidth;
      height = documentHeight();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const rippleValue = (x: number, y: number, now: number) => {
      let ripple = 0;

      for (let i = impulses.length - 1; i >= 0; i -= 1) {
        const impulse = impulses[i];
        const age = now - impulse.t;
        if (age > 1800) continue;

        const dx = x - impulse.x;
        const dy = y - impulse.y;
        const distance = Math.hypot(dx, dy);

        ripple +=
          Math.sin(distance * 0.072 - age * 0.018) *
          Math.exp(-distance * 0.0115) *
          Math.exp(-age * 0.0026);
      }

      return ripple;
    };

    const gyroidField = (x: number, y: number, now: number) => {
      const t = reducedMotion.matches ? 0 : now * 0.0005;
      const ripple = rippleValue(x, y, now);
      const sx = x * 0.017 + t * 1.25 + ripple * 0.6;
      const sy = y * 0.015 - t * 0.8 - ripple * 0.45;
      const sz = x * 0.007 - y * 0.005 + t * 1.6 + ripple * 0.7;

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

    const drawContourCell = (
      corners: [Point, Point, Point, Point],
      values: [number, number, number, number],
      iso: number,
    ) => {
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
        context.beginPath();
        context.moveTo(intersections[0].point.x, intersections[0].point.y);
        context.lineTo(intersections[1].point.x, intersections[1].point.y);
        context.stroke();
        return;
      }

      if (intersections.length === 4) {
        const center = (v0 + v1 + v2 + v3) * 0.25;
        const top = intersections.find((entry) => entry.edge === "top")?.point;
        const right = intersections.find((entry) => entry.edge === "right")?.point;
        const bottom = intersections.find((entry) => entry.edge === "bottom")?.point;
        const left = intersections.find((entry) => entry.edge === "left")?.point;

        if (!top || !right || !bottom || !left) return;

        const pairings: [Point, Point][] = center >= iso
          ? [[top, left], [right, bottom]]
          : [[top, right], [bottom, left]];

        for (const [start, end] of pairings) {
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.stroke();
        }
      }
    };

    const fieldWeightsAt = (x: number) => {
      const edgeDistance = Math.min(x, width - x);
      const transitionWidth = Math.min(560, Math.max(330, width * 0.36));
      const normalized = clamp(edgeDistance / transitionWidth, 0, 1);

      return {
        gyroid: 1 - smoothstep(0.16, 0.92, normalized),
        dots: smoothstep(0.22, 0.86, normalized),
        overlap: 1 - Math.abs(normalized * 2 - 1),
      };
    };

    const drawGyroid = (now: number) => {
      const step = width > 1500 ? 20 : 22;
      const yStart = TOP_PAD;
      const yEnd = Math.max(yStart + 160, height - BOTTOM_PAD);

      for (let y = yStart; y < yEnd; y += step) {
        for (let x = 0; x < width; x += step) {
          const weights = fieldWeightsAt(x + step * 0.5);
          if (weights.gyroid < 0.012) continue;

          const topLeft = { x, y };
          const topRight = { x: Math.min(x + step, width), y };
          const bottomRight = {
            x: Math.min(x + step, width),
            y: Math.min(y + step, yEnd),
          };
          const bottomLeft = { x, y: Math.min(y + step, yEnd) };

          const values: [number, number, number, number] = [
            gyroidField(topLeft.x, topLeft.y, now),
            gyroidField(topRight.x, topRight.y, now),
            gyroidField(bottomRight.x, bottomRight.y, now),
            gyroidField(bottomLeft.x, bottomLeft.y, now),
          ];

          const pulse = Math.min(1, Math.abs(rippleValue(x + step * 0.5, y + step * 0.5, now)));

          for (const iso of ISOS) {
            const isoWeight = 1 - Math.min(1, Math.abs(iso) / 0.9);
            const alpha =
              (0.035 + isoWeight * 0.11 + pulse * 0.16) *
              Math.pow(weights.gyroid, 1.2);
            const widthScale =
              0.7 + isoWeight * 0.85 + weights.gyroid * 1.05 + pulse * 1.4;

            context.strokeStyle = `rgba(118, 222, 255, ${alpha})`;
            context.lineWidth = widthScale;
            drawContourCell([topLeft, topRight, bottomRight, bottomLeft], values, iso);
          }
        }
      }
    };

    const drawDots = (now: number) => {
      const gap = width > 1500 ? 46 : 50;
      const yStart = TOP_PAD;
      const yEnd = Math.max(yStart + 160, height - BOTTOM_PAD);

      for (let y = yStart; y < yEnd; y += gap) {
        const offset = (Math.floor(y / gap) % 2) * gap * 0.5;

        for (let x = offset; x < width; x += gap) {
          const weights = fieldWeightsAt(x);
          if (weights.dots < 0.02) continue;

          const ripple = rippleValue(x, y, now);
          const field = gyroidField(x, y, now);
          const transitionWarp = weights.overlap * field * 2.4;
          const drawX = x + transitionWarp;
          const drawY = y + weights.overlap * Math.sin(field * 1.7) * 2.4;

          const radius =
            0.42 +
            weights.dots * 0.8 +
            weights.overlap * 0.34 +
            Math.max(0, ripple) * 2.25;

          const alpha =
            0.025 +
            weights.dots * 0.09 +
            weights.overlap * 0.045 +
            Math.min(0.16, Math.abs(ripple) * 0.14);

          context.beginPath();
          context.arc(drawX, drawY, radius, 0, Math.PI * 2);
          context.fillStyle = `rgba(158, 225, 255, ${alpha})`;
          context.fill();
        }
      }
    };

    const pruneImpulses = (now: number) => {
      for (let i = impulses.length - 1; i >= 0; i -= 1) {
        if (now - impulses[i].t > 1800) impulses.splice(i, 1);
      }
    };

    const draw = (now: number) => {
      if (now - lastRendered < FRAME_INTERVAL) {
        frame = window.requestAnimationFrame(draw);
        return;
      }

      lastRendered = now;
      pruneImpulses(now);
      context.clearRect(0, 0, width, height);

      if (wideEnough.matches) {
        drawGyroid(now);
        drawDots(now);
      }

      if (!reducedMotion.matches || impulses.length > 0) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    const addImpulse = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, summary, [role='button']")) return;

      impulses.push({
        x: event.pageX,
        y: event.pageY,
        t: performance.now(),
      });

      if (impulses.length > 5) impulses.shift();
      if (reducedMotion.matches) draw(performance.now());
    };

    resize();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => resize())
        : null;

    resizeObserver?.observe(document.body);

    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.addEventListener("pointerdown", addImpulse, { passive: true });

    if (reducedMotion.matches) draw(performance.now());
    else frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", addImpulse);
    };
  }, []);

  return (
    <>
      <style>{`
        .edge-lattice {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: auto !important;
          bottom: auto !important;
          z-index: -1;
          display: block;
          width: 100% !important;
          height: auto;
          max-width: none !important;
          pointer-events: none;
          opacity: .92;
          mask-image: none !important;
          -webkit-mask-image: none !important;
        }
        @media (max-width: 819px) {
          .edge-lattice { display: none !important; }
        }
      `}</style>
      <canvas ref={canvasRef} className="edge-lattice" aria-hidden="true" />
    </>
  );
}
