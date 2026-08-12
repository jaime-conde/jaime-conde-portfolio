"use client";

import { useEffect, useRef } from "react";

type LoadPulse = {
  x: number;
  y: number;
  startedAt: number;
  radius: number;
  strength: number;
};

type FieldPoint = {
  x: number;
  y: number;
  hoverEnergy: number;
  loadEnergy: number;
};

const MIN_WIDTH = 820;
const GRID_SPACING = 31;
const DEPTH_LAYERS = 3;
const POINTER_RADIUS = 230;
const FRAME_INTERVAL = 1000 / 30;
const PULSE_DURATION = 1450;
const MAX_PULSES = 4;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const hash = (row: number, column: number, type: number, layer: number) => {
  const value = Math.sin(
    row * 12.9898 + column * 78.233 + type * 37.719 + layer * 19.193,
  ) * 43758.5453;
  return value - Math.floor(value);
};

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

    document.body.classList.add("unified-field-active");

    const edgeBand = () => Math.min(470, Math.max(300, width * 0.27));

    const connectionStrength = (x: number) => {
      const distanceToEdge = Math.min(x, width - x);
      return 1 - smoothstep(edgeBand() * 0.12, edgeBand(), distanceToEdge);
    };

    const resize = () => {
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35);
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

        const normalizedDistance = distance / pulse.radius;
        const spatialFalloff = Math.pow(1 - normalizedDistance, 2);
        const elasticEnvelope = Math.sin(Math.PI * age) * Math.exp(-1.35 * age);
        const response = spatialFalloff * elasticEnvelope * pulse.strength;
        const directionX = distance > 0.5 ? dx / distance : 0;
        const directionY = distance > 0.5 ? dy / distance : 0;

        offsetX += directionX * response * 25;
        offsetY += directionY * response * 25;
        peakIntensity = Math.max(peakIntensity, Math.min(1, response * 1.55));
      }

      return { offsetX, offsetY, peakIntensity };
    };

    const pointAt = (
      row: number,
      column: number,
      layer: number,
      now: number,
    ): FieldPoint => {
      const depth = layer / Math.max(1, DEPTH_LAYERS - 1);
      const baseX = GRID_SPACING / 2 + column * GRID_SPACING + depth * 8;
      const baseY = GRID_SPACING / 2 + row * GRID_SPACING - depth * 6;
      const distance = Math.hypot(pointer.x - baseX, pointer.y - baseY);
      const influence = pointer.active
        ? Math.max(0, 1 - distance / POINTER_RADIUS)
        : 0;
      const hoverEnergy = influence * influence * (3 - 2 * influence);
      const hoverDirectionX = distance > 0.5 ? (baseX - pointer.x) / distance : 0;
      const hoverDirectionY = distance > 0.5 ? (baseY - pointer.y) / distance : 0;
      const load = pulseResponse(baseX, baseY, now);

      return {
        x: baseX + hoverDirectionX * hoverEnergy * 16 + load.offsetX,
        y: baseY + hoverDirectionY * hoverEnergy * 16 + load.offsetY,
        hoverEnergy,
        loadEnergy: load.peakIntensity,
      };
    };

    const drawConnection = (
      from: FieldPoint,
      to: FieldPoint,
      strength: number,
      layer: number,
      diagonal: boolean,
    ) => {
      const hoverEnergy = Math.max(from.hoverEnergy, to.hoverEnergy);
      const loadEnergy = Math.max(from.loadEnergy, to.loadEnergy);
      const layerFade = 1 - layer * 0.26;
      const baseAlpha = (diagonal ? 0.055 : 0.085) * strength * layerFade;

      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.strokeStyle =
        loadEnergy > 0.015
          ? contourColor(loadEnergy, (0.22 + loadEnergy * 0.58) * strength * layerFade)
          : hoverEnergy > 0.015
            ? `rgba(102, 226, 255, ${(0.11 + hoverEnergy * 0.32) * strength * layerFade})`
            : `rgba(105, 174, 207, ${baseAlpha})`;
      context.lineWidth =
        (diagonal ? 0.48 : 0.66) + hoverEnergy * 0.85 + loadEnergy * 1.1;
      context.stroke();
    };

    const draw = (now: number) => {
      if (now - lastRendered < FRAME_INTERVAL) {
        frame = window.requestAnimationFrame(draw);
        return;
      }
      lastRendered = now;
      context.clearRect(0, 0, width, height);

      const rows = Math.ceil(height / GRID_SPACING) + 1;
      const columns = Math.ceil(width / GRID_SPACING) + 1;

      if (wideEnough.matches) {
        for (let layer = DEPTH_LAYERS - 1; layer >= 0; layer -= 1) {
          const points: FieldPoint[][] = [];
          for (let row = 0; row < rows; row += 1) {
            const rowPoints: FieldPoint[] = [];
            for (let column = 0; column < columns; column += 1) {
              rowPoints.push(pointAt(row, column, layer, now));
            }
            points.push(rowPoints);
          }

          for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
              const point = points[row][column];
              const strength = connectionStrength(point.x);
              if (strength <= 0.015) continue;

              const probability = Math.pow(strength, 1.25);
              const layerPenalty = layer * 0.09;

              if (
                column + 1 < columns &&
                hash(row, column, 0, layer) < probability - layerPenalty
              ) {
                drawConnection(point, points[row][column + 1], strength, layer, false);
              }

              if (
                row + 1 < rows &&
                hash(row, column, 1, layer) < probability * 0.92 - layerPenalty
              ) {
                drawConnection(point, points[row + 1][column], strength, layer, false);
              }

              if (
                row + 1 < rows &&
                column + 1 < columns &&
                hash(row, column, 2, layer) < probability * 0.72 - layerPenalty
              ) {
                const target = (row + column + layer) % 2 === 0
                  ? points[row + 1][column + 1]
                  : points[row + 1][column];
                drawConnection(point, target, strength, layer, true);
              }
            }
          }
        }
      }

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const point = pointAt(row, column, 0, now);
          const strength = connectionStrength(point.x);
          const dotBlend = 1 - strength;
          const dotRadius =
            0.58 + point.hoverEnergy * 1.7 + point.loadEnergy * 2.35 + strength * 0.18;
          const idleAlpha = 0.16 + dotBlend * 0.05;

          context.beginPath();
          context.arc(point.x, point.y, dotRadius, 0, Math.PI * 2);
          context.fillStyle =
            point.loadEnergy > 0.015
              ? contourColor(point.loadEnergy, 0.36 + point.loadEnergy * 0.54)
              : point.hoverEnergy > 0.015
                ? `rgba(151, 238, 255, ${0.26 + point.hoverEnergy * 0.5})`
                : `rgba(175, 222, 255, ${idleAlpha})`;
          context.fill();
        }
      }

      for (const pulse of pulses) {
        const age = (now - pulse.startedAt) / PULSE_DURATION;
        if (age < 0 || age > 1) continue;
        const progress = 1 - Math.pow(1 - age, 2);
        context.beginPath();
        context.arc(
          pulse.x,
          pulse.y,
          12 + pulse.radius * 0.25 * progress,
          0,
          Math.PI * 2,
        );
        context.strokeStyle = `rgba(81, 220, 255, ${0.18 * (1 - age)})`;
        context.lineWidth = 1;
        context.stroke();
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
      document.body.classList.remove("unified-field-active");
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
        body.unified-field-active::before { opacity: 0 !important; }
        .edge-lattice {
          position: fixed !important;
          inset: 0 !important;
          z-index: -1;
          width: 100vw !important;
          height: 100vh !important;
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
