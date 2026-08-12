"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Impulse = { x: number; y: number; t: number };

const MIN_WIDTH = 820;
const FRAME_INTERVAL = 1000 / 30;
const TOP_PAD = 52;
const BOTTOM_PAD = 72;
const ISOS = [-0.55, 0.05, 0.62];

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

    const gyroidField = (x: number, y: number, now: number) => {
      const t = reducedMotion.matches ? 0 : now * 0.00022;
      const sx = x * 0.018;
      const sy = y * 0.016;
      const sz = t + x * 0.008 - y * 0.006;

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
        intersections.push({
          edge: "top",
          point: lerpEdge(topLeft, topRight, v0, v1, iso),
        });
      }
      if ((v1 < iso && v2 >= iso) || (v1 >= iso && v2 < iso)) {
        intersections.push({
          edge: "right",
          point: lerpEdge(topRight, bottomRight, v1, v2, iso),
        });
      }
      if ((v2 < iso && v3 >= iso) || (v2 >= iso && v3 < iso)) {
        intersections.push({
          edge: "bottom",
          point: lerpEdge(bottomRight, bottomLeft, v2, v3, iso),
        });
      }
      if ((v3 < iso && v0 >= iso) || (v3 >= iso && v0 < iso)) {
        intersections.push({
          edge: "left",
          point: lerpEdge(bottomLeft, topLeft, v3, v0, iso),
        });
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

        const pairings: [Point, Point][] =
          center >= iso
            ? [
                [top, left],
                [right, bottom],
              ]
            : [
                [top, right],
                [bottom, left],
              ];

        for (const [start, end] of pairings) {
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.stroke();
        }
      }
    };

    const edgeStrengthAt = (x: number) => {
      const edgeDistance = Math.min(x, width - x);
      const fadeBand = Math.min(380, Math.max(210, width * 0.28));
      return 1 - clamp(edgeDistance / fadeBand, 0, 1);
    };

    const centerDotStrengthAt = (x: number) => {
      const edgeDistance = Math.min(x, width - x);
      const fadeBand = Math.min(430, Math.max(240, width * 0.31));
      return smoothstep(fadeBand * 0.28, fadeBand, edgeDistance);
    };

    const drawGyroidEdges = (now: number) => {
      const step = width > 1440 ? 18 : 20;
      const yStart = TOP_PAD;
      const yEnd = Math.max(yStart + 160, height - BOTTOM_PAD);

      for (let y = yStart; y < yEnd; y += step) {
        for (let x = 0; x < width; x += step) {
          const topLeft = { x, y };
          const topRight = { x: Math.min(x + step, width), y };
          const bottomRight = {
            x: Math.min(x + step, width),
            y: Math.min(y + step, yEnd),
          };
          const bottomLeft = {
            x,
            y: Math.min(y + step, yEnd),
          };

          const blend = edgeStrengthAt(x + step * 0.5);
          if (blend < 0.015) continue;

          const values: [number, number, number, number] = [
            gyroidField(topLeft.x, topLeft.y, now),
            gyroidField(topRight.x, topRight.y, now),
            gyroidField(bottomRight.x, bottomRight.y, now),
            gyroidField(bottomLeft.x, bottomLeft.y, now),
          ];

          for (const iso of ISOS) {
            const isoWeight = 1 - Math.min(1, Math.abs(iso) / 0.9);
            const alpha = (0.03 + isoWeight * 0.12) * Math.pow(blend, 1.55);
            const widthScale = 0.65 + isoWeight * 0.95 + blend * 1.15;

            context.strokeStyle = `rgba(120, 221, 255, ${alpha})`;
            context.lineWidth = widthScale;
            drawContourCell(
              [topLeft, topRight, bottomRight, bottomLeft],
              values,
              iso,
            );
          }
        }
      }
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

        const wave =
          Math.sin(distance * 0.075 - age * 0.018) *
          Math.exp(-distance * 0.012) *
          Math.exp(-age * 0.0028);

        ripple += wave;
      }

      return ripple;
    };

    const drawDots = (now: number) => {
      const gap = width > 1500 ? 28 : 30;
      const yStart = TOP_PAD;
      const yEnd = Math.max(yStart + 160, height - BOTTOM_PAD);

      for (let y = yStart; y < yEnd; y += gap) {
        const offset = (Math.floor(y / gap) % 2) * gap * 0.5;

        for (let x = offset; x < width; x += gap) {
          const centerBlend = centerDotStrengthAt(x);
          if (centerBlend < 0.03) continue;

          const ripple = rippleValue(x, y, now);
          const radius =
            0.55 +
            centerBlend * 1.35 +
            Math.max(0, ripple) * 2.15;

          const alpha =
            0.035 +
            centerBlend * 0.16 +
            Math.min(0.16, Math.abs(ripple) * 0.12);

          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fillStyle = `rgba(160, 225, 255, ${alpha})`;
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
        drawGyroidEdges(now);
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

      if (reducedMotion.matches) {
        draw(performance.now());
      }
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

    if (reducedMotion.matches) {
      draw(performance.now());
    } else {
      frame = window.requestAnimationFrame(draw);
    }

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
          opacity: .95;
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
