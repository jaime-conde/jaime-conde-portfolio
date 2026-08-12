"use client";

import { useEffect, useRef } from "react";

const MIN_WIDTH = 820;
const FRAME_INTERVAL = 1000 / 24;
const TOP_FADE = 58;
const BOTTOM_FADE = 92;
const ISOS = [-0.92, -0.48, 0, 0.48, 0.92];

type Point = { x: number; y: number };

type PointerState = {
  x: number;
  y: number;
  active: boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function EdgeLattice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wideEnough = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const pointer: PointerState = { x: -1000, y: -1000, active: false };

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let lastRendered = -FRAME_INTERVAL;

    const resize = () => {
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const sampleField = (
      x: number,
      y: number,
      side: -1 | 1,
      layer: number,
      now: number,
      bandWidth: number,
    ) => {
      const edgeDistance = side < 0 ? x : width - x;
      const inwardRatio = clamp(edgeDistance / bandWidth, 0, 1);
      const yRatio = height > 0 ? y / height : 0;

      const spatialDensity =
        1.05 +
        (1 - inwardRatio) * 0.9 +
        Math.sin(yRatio * Math.PI * 1.2) * 0.12;

      const pointerDistance = Math.hypot(pointer.x - x, pointer.y - y);
      const pointerInfluence = pointer.active
        ? Math.max(0, 1 - pointerDistance / 260)
        : 0;
      const easedInfluence =
        pointerInfluence * pointerInfluence * (3 - 2 * pointerInfluence);

      const wave = reducedMotion.matches ? 0 : now * 0.00042;
      const gyroidScale = 0.055 * spatialDensity;

      const sx =
        x * gyroidScale +
        side * (layer * 0.9 + wave * 1.1) +
        easedInfluence * 0.65;
      const sy =
        y * gyroidScale * (1.06 + layer * 0.05) +
        wave * 0.9 -
        easedInfluence * 0.45;
      const sz =
        layer * 1.32 +
        wave * 1.2 +
        (1 - inwardRatio) * 1.6 +
        yRatio * 0.85;

      const gyroid =
        Math.sin(sx) * Math.cos(sy) +
        Math.sin(sy) * Math.cos(sz) +
        Math.sin(sz) * Math.cos(sx);

      const thicknessBias =
        -0.3 +
        (1 - inwardRatio) * 0.82 +
        Math.sin(yRatio * Math.PI * 0.8) * 0.1;

      return gyroid + thicknessBias + easedInfluence * 0.32;
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

    const drawCellContours = (
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

    const drawGyroidSide = (side: -1 | 1, now: number) => {
      const bandWidth = clamp(width * 0.17, 132, 222);
      const xStart = side < 0 ? 0 : width - bandWidth;
      const xEnd = side < 0 ? bandWidth : width;
      const yStart = TOP_FADE;
      const yEnd = Math.max(yStart + 120, height - BOTTOM_FADE);
      const step = width > 1440 ? 18 : 20;
      const layerCount = 3;

      for (let layer = 0; layer < layerCount; layer += 1) {
        const layerDepth = layer / Math.max(layerCount - 1, 1);
        const offset = layer * 8;

        for (const iso of ISOS) {
          const isoWeight = 1 - Math.min(1, Math.abs(iso) / 1.1);
          const strokeAlpha =
            (0.085 + isoWeight * 0.08) * (0.78 - layerDepth * 0.18);
          const strokeWidth =
            0.58 + isoWeight * 0.42 + (1 - layerDepth) * 0.22;

          context.strokeStyle = `rgba(119, 222, 248, ${strokeAlpha})`;
          context.lineWidth = strokeWidth;

          for (let y = yStart; y < yEnd; y += step) {
            for (let x = xStart; x < xEnd; x += step) {
              const topLeft = { x, y };
              const topRight = { x: Math.min(x + step, xEnd), y };
              const bottomRight = {
                x: Math.min(x + step, xEnd),
                y: Math.min(y + step, yEnd),
              };
              const bottomLeft = {
                x,
                y: Math.min(y + step, yEnd),
              };

              const values: [number, number, number, number] = [
                sampleField(topLeft.x + offset, topLeft.y, side, layer, now, bandWidth),
                sampleField(topRight.x + offset, topRight.y, side, layer, now, bandWidth),
                sampleField(bottomRight.x + offset, bottomRight.y, side, layer, now, bandWidth),
                sampleField(bottomLeft.x + offset, bottomLeft.y, side, layer, now, bandWidth),
              ];

              drawCellContours(
                [topLeft, topRight, bottomRight, bottomLeft],
                values,
                iso,
              );
            }
          }
        }
      }

      const gradientWidth = Math.min(26, bandWidth * 0.16);
      const edgeGlow =
        side < 0
          ? context.createLinearGradient(0, 0, gradientWidth, 0)
          : context.createLinearGradient(width, 0, width - gradientWidth, 0);

      edgeGlow.addColorStop(0, "rgba(118, 221, 255, 0.22)");
      edgeGlow.addColorStop(1, "rgba(118, 221, 255, 0)");

      context.fillStyle = edgeGlow;
      context.fillRect(
        side < 0 ? 0 : width - gradientWidth,
        yStart,
        gradientWidth,
        yEnd - yStart,
      );
    };

    const draw = (now: number) => {
      if (now - lastRendered < FRAME_INTERVAL) {
        frame = window.requestAnimationFrame(draw);
        return;
      }

      lastRendered = now;
      context.clearRect(0, 0, width, height);

      if (wideEnough.matches) {
        drawGyroidSide(-1, now);
        drawGyroidSide(1, now);
      }

      if (!reducedMotion.matches) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const leave = () => {
      pointer.active = false;
    };

    const update = () => {
      resize();
      if (reducedMotion.matches) draw(performance.now());
    };

    resize();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);

    if (reducedMotion.matches) {
      draw(performance.now());
    } else {
      frame = window.requestAnimationFrame(draw);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  return <canvas ref={canvasRef} className="edge-lattice" aria-hidden="true" />;
}
