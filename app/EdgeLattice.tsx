"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Impulse = { x: number; y: number; t: number };
type PointerState = { x: number; y: number; active: boolean };

const MIN_WIDTH = 820;
const TOP_PAD = 52;
const BOTTOM_PAD = 72;
const LAYERS = [
  { phase: 0.0, offsetX: 0, offsetY: 0, alpha: 1.0, width: 1.0 },
  { phase: 1.25, offsetX: 7, offsetY: -5, alpha: 0.56, width: 0.82 },
  { phase: 2.35, offsetX: 13, offsetY: -10, alpha: 0.32, width: 0.68 },
];
const ISOS = [-0.52, 0.12, 0.68];

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

    const wideEnough = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer: PointerState = { x: -1000, y: -1000, active: false };
    const impulses: Impulse[] = [];

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let interactionUntil = 0;
    let lastMoveDraw = 0;

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
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      requestDraw();
    };

    const edgeBand = () => Math.min(520, Math.max(300, width * 0.34));

    const edgeWeightAt = (x: number) => {
      const edgeDistance = Math.min(x, width - x);
      const band = edgeBand();
      return 1 - smoothstep(band * 0.32, band, edgeDistance);
    };

    const dotWeightAt = (x: number) => {
      const edgeDistance = Math.min(x, width - x);
      const band = edgeBand();
      return smoothstep(band * 0.18, band * 0.92, edgeDistance);
    };

    const localInteraction = (x: number, y: number, now: number) => {
      let hover = 0;
      if (pointer.active) {
        const distance = Math.hypot(pointer.x - x, pointer.y - y);
        hover = smoothstep(250, 0, distance);
      }

      let click = 0;
      for (const impulse of impulses) {
        const age = now - impulse.t;
        if (age > 1200) continue;
        const distance = Math.hypot(impulse.x - x, impulse.y - y);
        const radial = Math.exp(-distance * 0.0085);
        const temporal = Math.exp(-age * 0.0032);
        click += radial * temporal;
      }

      return { hover, click: clamp(click, 0, 1.5) };
    };

    const gyroidField = (
      x: number,
      y: number,
      phase: number,
      now: number,
    ) => {
      const interaction = localInteraction(x, y, now);
      const edge = edgeWeightAt(x);
      const baseFrequency = 0.0154 + edge * 0.0062;
      const frequency =
        baseFrequency *
        (1 + interaction.hover * 0.42 + interaction.click * 0.95);

      const sx = x * frequency + phase + interaction.click * 1.7;
      const sy = y * frequency * 0.93 - phase * 0.62 - interaction.hover * 0.45;
      const sz =
        x * frequency * 0.58 -
        y * frequency * 0.34 +
        phase * 1.15 +
        interaction.click * 2.45;

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
      } else if (intersections.length === 4) {
        const center = (v0 + v1 + v2 + v3) * 0.25;
        const top = intersections.find((entry) => entry.edge === "top")?.point;
        const right = intersections.find((entry) => entry.edge === "right")?.point;
        const bottom = intersections.find((entry) => entry.edge === "bottom")?.point;
        const left = intersections.find((entry) => entry.edge === "left")?.point;
        if (!top || !right || !bottom || !left) return;

        const pairs: [Point, Point][] = center >= iso
          ? [[top, left], [right, bottom]]
          : [[top, right], [bottom, left]];

        for (const [start, end] of pairs) {
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.stroke();
        }
      }
    };

    const drawStackedGyroid = (now: number) => {
      const step = width > 1500 ? 24 : 26;
      const yStart = TOP_PAD;
      const yEnd = Math.max(yStart + 160, height - BOTTOM_PAD);

      for (const layer of LAYERS) {
        for (let y = yStart; y < yEnd; y += step) {
          for (let x = 0; x < width; x += step) {
            const centerX = x + step * 0.5;
            const edgeBlend = edgeWeightAt(centerX);
            if (edgeBlend < 0.018) continue;

            const local = localInteraction(centerX, y + step * 0.5, now);
            const transitionDots = dotWeightAt(centerX);
            const contourAlpha =
              (0.035 + edgeBlend * 0.15) *
              layer.alpha *
              (1 - transitionDots * 0.42) *
              (1 + local.hover * 0.48 + local.click * 0.72);

            const topLeft = { x: x + layer.offsetX, y: y + layer.offsetY };
            const topRight = { x: Math.min(x + step, width) + layer.offsetX, y: y + layer.offsetY };
            const bottomRight = {
              x: Math.min(x + step, width) + layer.offsetX,
              y: Math.min(y + step, yEnd) + layer.offsetY,
            };
            const bottomLeft = {
              x: x + layer.offsetX,
              y: Math.min(y + step, yEnd) + layer.offsetY,
            };

            const values: [number, number, number, number] = [
              gyroidField(topLeft.x, topLeft.y, layer.phase, now),
              gyroidField(topRight.x, topRight.y, layer.phase, now),
              gyroidField(bottomRight.x, bottomRight.y, layer.phase, now),
              gyroidField(bottomLeft.x, bottomLeft.y, layer.phase, now),
            ];

            for (const iso of ISOS) {
              const isoWeight = 1 - Math.min(1, Math.abs(iso) / 0.9);
              context.strokeStyle = `rgba(119, 222, 248, ${contourAlpha * (0.62 + isoWeight * 0.38)})`;
              context.lineWidth =
                (0.7 + isoWeight * 0.9 + edgeBlend * 1.15) * layer.width;
              drawContourCell([topLeft, topRight, bottomRight, bottomLeft], values, iso);
            }
          }
        }
      }
    };

    const drawDots = (now: number) => {
      const gap = width > 1500 ? 58 : 54;
      const yStart = TOP_PAD;
      const yEnd = Math.max(yStart + 160, height - BOTTOM_PAD);

      for (let y = yStart; y < yEnd; y += gap) {
        const rowOffset = (Math.floor(y / gap) % 2) * gap * 0.5;
        for (let x = rowOffset; x < width; x += gap) {
          const dotBlend = dotWeightAt(x);
          if (dotBlend < 0.04) continue;

          const edgeBlend = edgeWeightAt(x);
          const local = localInteraction(x, y, now);
          const gyroidSample = Math.abs(gyroidField(x, y, 0.4, now));
          const transitionMod = 0.72 + (1 - Math.min(1, gyroidSample)) * 0.52;

          const radius =
            0.5 +
            dotBlend * 0.82 +
            edgeBlend * 0.35 +
            local.hover * 0.6 +
            local.click * 2.35;

          const alpha =
            (0.035 + dotBlend * 0.09 + edgeBlend * 0.045) *
            transitionMod +
            local.click * 0.09;

          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fillStyle = `rgba(160, 225, 255, ${Math.min(0.32, alpha)})`;
          context.fill();
        }
      }
    };

    const pruneImpulses = (now: number) => {
      for (let i = impulses.length - 1; i >= 0; i -= 1) {
        if (now - impulses[i].t > 1200) impulses.splice(i, 1);
      }
    };

    const render = (now = performance.now()) => {
      frame = 0;
      pruneImpulses(now);
      context.clearRect(0, 0, width, height);
      if (!wideEnough.matches) return;

      drawStackedGyroid(now);
      drawDots(now);

      if (!reducedMotion.matches && (impulses.length > 0 || now < interactionUntil)) {
        frame = window.requestAnimationFrame(render);
      }
    };

    function requestDraw() {
      if (frame) return;
      frame = window.requestAnimationFrame(render);
    }

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.pageX;
      pointer.y = event.pageY;
      pointer.active = true;
      interactionUntil = performance.now() + 90;

      const now = performance.now();
      if (now - lastMoveDraw > 34) {
        lastMoveDraw = now;
        requestDraw();
      }
    };

    const leave = () => {
      pointer.active = false;
      requestDraw();
    };

    const click = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, summary, [role='button']")) return;

      impulses.push({ x: event.pageX, y: event.pageY, t: performance.now() });
      if (impulses.length > 4) impulses.shift();
      interactionUntil = performance.now() + 1200;
      requestDraw();
    };

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : null;

    resizeObserver?.observe(document.body);
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);

    resize();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click);
      document.documentElement.removeEventListener("mouseleave", leave);
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
