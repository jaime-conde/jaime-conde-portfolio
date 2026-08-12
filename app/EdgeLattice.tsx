"use client";

import { useEffect, useRef } from "react";

type Point3D = {
  x: number;
  y: number;
  z: number;
  row: number;
  column: number;
  layer: number;
  hoverEnergy: number;
  loadEnergy: number;
};

type Segment = {
  from: Point3D;
  to: Point3D;
  depth: number;
  diagonal: boolean;
};

type LoadPulse = {
  x: number;
  y: number;
  startedAt: number;
  radius: number;
  strength: number;
};

const MIN_WIDTH = 820;
const POINTER_RADIUS = 230;
const CELL = 38;
const DEPTH_LAYERS = 4;
const WIDTH_NODES = 5;
const FRAME_INTERVAL = 1000 / 30;
const PULSE_DURATION = 1450;
const MAX_PULSES = 4;

const contourColor = (intensity: number, alpha: number) => {
  const stops = [
    [64, 139, 255],
    [56, 224, 232],
    [73, 224, 151],
    [255, 216, 74],
    [255, 86, 72],
  ];
  const scaled = Math.min(0.999, intensity) * (stops.length - 1);
  const index = Math.floor(scaled);
  const mix = scaled - index;
  const from = stops[index];
  const to = stops[Math.min(index + 1, stops.length - 1)];
  const channel = (position: number) =>
    Math.round(from[position] + (to[position] - from[position]) * mix);

  return `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${alpha})`;
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
    const pointer = { x: -1000, y: -1000, active: false };
    const pulses: LoadPulse[] = [];
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

        const spatialFalloff = Math.pow(1 - distance / pulse.radius, 2);
        const envelope = Math.sin(Math.PI * age) * Math.exp(-1.35 * age);
        const response = spatialFalloff * envelope * pulse.strength;
        const directionX = distance > 0.5 ? dx / distance : 0;
        const directionY = distance > 0.5 ? dy / distance : 0;

        offsetX += directionX * response * 32;
        offsetY += directionY * response * 32;
        peakIntensity = Math.max(peakIntensity, Math.min(1, response * 1.55));
      }

      return { offsetX, offsetY, peakIntensity };
    };

    const project = (
      side: -1 | 1,
      row: number,
      column: number,
      layer: number,
      now: number,
    ): Point3D => {
      const edge = side < 0 ? 0 : width;
      const depthRatio = layer / (DEPTH_LAYERS - 1);
      const columnRatio = column / (WIDTH_NODES - 1);
      const baseY = row * CELL + (column % 2) * CELL * 0.5;
      const inward = 15 + columnRatio * Math.min(185, width * 0.11);
      const perspectiveX = depthRatio * 54;
      const perspectiveY = depthRatio * -18;
      const screenX = edge - side * (inward + perspectiveX);
      const screenY = baseY + perspectiveY;
      const distance = Math.hypot(pointer.x - screenX, pointer.y - screenY);
      const influence = pointer.active ? Math.max(0, 1 - distance / POINTER_RADIUS) : 0;
      const hoverEnergy = influence * influence * (3 - 2 * influence);
      const direction = distance > 1 ? (screenY - pointer.y) / distance : 0;
      const breathing = reducedMotion.matches
        ? 0
        : Math.sin(now * 0.00125 + row * 0.42 + layer) * 1.2;
      const load = pulseResponse(screenX, screenY, now);

      return {
        x:
          screenX +
          side * hoverEnergy * (22 + depthRatio * 18) +
          load.offsetX,
        y:
          screenY +
          direction * hoverEnergy * 22 +
          breathing * depthRatio +
          load.offsetY,
        z: depthRatio,
        row,
        column,
        layer,
        hoverEnergy,
        loadEnergy: load.peakIntensity,
      };
    };

    const createVolume = (side: -1 | 1, now: number) => {
      const points = new Map<string, Point3D>();
      const segments: Segment[] = [];
      const rows = Math.ceil(height / CELL) + 3;
      const key = (row: number, column: number, layer: number) => `${row}:${column}:${layer}`;

      for (let layer = 0; layer < DEPTH_LAYERS; layer += 1) {
        for (let column = 0; column < WIDTH_NODES; column += 1) {
          for (let row = -2; row < rows; row += 1) {
            points.set(key(row, column, layer), project(side, row, column, layer, now));
          }
        }
      }

      const connect = (
        point: Point3D,
        row: number,
        column: number,
        layer: number,
        diagonal = false,
      ) => {
        const target = points.get(key(row, column, layer));
        if (!target) return;
        segments.push({
          from: point,
          to: target,
          depth: (point.z + target.z) * 0.5,
          diagonal,
        });
      };

      for (const point of points.values()) {
        connect(point, point.row + 1, point.column, point.layer);
        connect(point, point.row, point.column + 1, point.layer);
        connect(point, point.row, point.column, point.layer + 1);

        const flip = (point.row + point.column + point.layer) % 2 === 0 ? 1 : -1;
        connect(point, point.row + flip, point.column + 1, point.layer + 1, true);
        connect(point, point.row - flip, point.column + 1, point.layer + 1, true);
      }

      return { points: [...points.values()], segments };
    };

    const drawVolume = (side: -1 | 1, now: number) => {
      const { points, segments } = createVolume(side, now);
      segments.sort((a, b) => b.depth - a.depth);

      for (const segment of segments) {
        const hoverEnergy = Math.max(segment.from.hoverEnergy, segment.to.hoverEnergy);
        const loadEnergy = Math.max(segment.from.loadEnergy, segment.to.loadEnergy);
        const depthFade = 0.2 + (1 - segment.depth) * 0.8;
        const baseAlpha = segment.diagonal ? 0.075 : 0.1;
        context.beginPath();
        context.moveTo(segment.from.x, segment.from.y);
        context.lineTo(segment.to.x, segment.to.y);
        context.strokeStyle =
          loadEnergy > 0.015
            ? contourColor(loadEnergy, (0.28 + loadEnergy * 0.62) * depthFade)
            : hoverEnergy > 0.015
              ? `rgba(102, 226, 255, ${(0.14 + hoverEnergy * 0.42) * depthFade})`
              : `rgba(105, 174, 207, ${baseAlpha * depthFade})`;
        context.lineWidth =
          (segment.diagonal ? 0.55 : 0.72) + hoverEnergy * 1.15 + loadEnergy * 1.4;
        context.stroke();
      }

      points.sort((a, b) => b.z - a.z);
      for (const point of points) {
        const depthFade = 0.25 + (1 - point.z) * 0.75;
        context.beginPath();
        context.arc(
          point.x,
          point.y,
          0.75 + point.hoverEnergy * 2.25 + point.loadEnergy * 2.5,
          0,
          Math.PI * 2,
        );
        context.fillStyle =
          point.loadEnergy > 0.015
            ? contourColor(point.loadEnergy, (0.4 + point.loadEnergy * 0.54) * depthFade)
            : point.hoverEnergy > 0.015
              ? `rgba(151, 238, 255, ${(0.3 + point.hoverEnergy * 0.62) * depthFade})`
              : `rgba(153, 207, 232, ${0.18 * depthFade})`;
        context.fill();
      }
    };

    const draw = (now: number) => {
      if (now - lastRendered < FRAME_INTERVAL) {
        frame = window.requestAnimationFrame(draw);
        return;
      }
      lastRendered = now;
      context.clearRect(0, 0, width, height);

      if (wideEnough.matches) {
        drawVolume(-1, now);
        drawVolume(1, now);
      }

      for (let index = pulses.length - 1; index >= 0; index -= 1) {
        if (now - pulses[index].startedAt > PULSE_DURATION) pulses.splice(index, 1);
      }

      if (!reducedMotion.matches) frame = window.requestAnimationFrame(draw);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const applyLoad = (event: PointerEvent) => {
      if (event.button !== 0 || reducedMotion.matches) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input, textarea, select, summary, [role='button']")) return;

      const responsiveRadius = Math.min(190, Math.max(125, window.innerWidth * 0.16));
      pulses.push({
        x: event.clientX,
        y: event.clientY,
        startedAt: performance.now(),
        radius: responsiveRadius,
        strength: 1,
      });
      if (pulses.length > MAX_PULSES) pulses.shift();
    };

    const leave = () => {
      pointer.active = false;
    };

    resize();
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", applyLoad, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);

    if (reducedMotion.matches) draw(performance.now());
    else frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", applyLoad);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <>
      <style>{`
        .edge-lattice {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          max-width: none !important;
          mask-image: linear-gradient(
            to right,
            black 0%,
            black 14%,
            rgba(0,0,0,.78) 20%,
            transparent 29%,
            transparent 71%,
            rgba(0,0,0,.78) 80%,
            black 86%,
            black 100%
          ) !important;
          -webkit-mask-image: linear-gradient(
            to right,
            black 0%,
            black 14%,
            rgba(0,0,0,.78) 20%,
            transparent 29%,
            transparent 71%,
            rgba(0,0,0,.78) 80%,
            black 86%,
            black 100%
          ) !important;
          mask-composite: add !important;
          -webkit-mask-composite: source-over !important;
        }
      `}</style>
      <canvas ref={canvasRef} className="edge-lattice" aria-hidden="true" />
    </>
  );
}
