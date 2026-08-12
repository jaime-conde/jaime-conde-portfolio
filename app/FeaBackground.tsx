"use client";

import { useEffect, useRef } from "react";

type LoadPulse = {
  x: number;
  y: number;
  startedAt: number;
  radius: number;
  strength: number;
};

const GRID_SPACING = 31;
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
  const channel = (position: number) => Math.round(from[position] + (to[position] - from[position]) * mix);

  return `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${alpha})`;
};

export default function FeaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pulses: LoadPulse[] = [];
    let frame = 0;
    let width = document.documentElement.clientWidth;
    let height = window.innerHeight;
    let pixelRatio = 1;

    document.body.classList.add("fea-background-active");

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

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height);

      for (let y = GRID_SPACING / 2; y < height; y += GRID_SPACING) {
        for (let x = GRID_SPACING / 2; x < width; x += GRID_SPACING) {
          let displacedX = x;
          let displacedY = y;
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

            displacedX += directionX * response * 25;
            displacedY += directionY * response * 25;
            peakIntensity = Math.max(peakIntensity, Math.min(1, response * 1.55));
          }

          const dotRadius = 0.58 + peakIntensity * 2.35;
          context.beginPath();
          context.arc(displacedX, displacedY, dotRadius, 0, Math.PI * 2);
          context.fillStyle = peakIntensity > 0.015
            ? contourColor(peakIntensity, 0.36 + peakIntensity * 0.54)
            : "rgba(175, 222, 255, 0.18)";
          context.fill();
        }
      }

      for (const pulse of pulses) {
        const age = (now - pulse.startedAt) / PULSE_DURATION;
        if (age < 0 || age > 1) continue;
        const progress = 1 - Math.pow(1 - age, 2);
        context.beginPath();
        context.arc(pulse.x, pulse.y, 12 + pulse.radius * 0.25 * progress, 0, Math.PI * 2);
        context.strokeStyle = `rgba(81, 220, 255, ${0.22 * (1 - age)})`;
        context.lineWidth = 1;
        context.stroke();
      }

      for (let index = pulses.length - 1; index >= 0; index -= 1) {
        if (now - pulses[index].startedAt > PULSE_DURATION) pulses.splice(index, 1);
      }

      frame = window.requestAnimationFrame(draw);
    };

    const applyLoad = (event: PointerEvent) => {
      if (reducedMotion.matches || event.button !== 0) return;
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

    resize();
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.addEventListener("pointerdown", applyLoad, { passive: true });
    frame = window.requestAnimationFrame(draw);

    return () => {
      document.body.classList.remove("fea-background-active");
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", applyLoad);
    };
  }, []);

  return (
    <>
      <style>{`
        body.fea-background-active::before { opacity: 0; }
        body.fea-background-active > main { position: relative; isolation: isolate; }
        .fea-background-canvas {
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          mask-image: linear-gradient(to bottom, black, rgba(0, 0, 0, .72) 60%, transparent 96%);
        }
      `}</style>
      <canvas ref={canvasRef} className="fea-background-canvas" aria-hidden="true" />
    </>
  );
}
