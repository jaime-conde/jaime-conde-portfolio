"use client";

import { useEffect, useRef } from "react";

type Point3D = {
  x: number;
  y: number;
  z: number;
  row: number;
  column: number;
  layer: number;
  energy: number;
};

type Segment = {
  from: Point3D;
  to: Point3D;
  depth: number;
  diagonal: boolean;
};

const MIN_WIDTH = 820;
const POINTER_RADIUS = 230;
const CELL = 38;
const DEPTH_LAYERS = 4;
const WIDTH_NODES = 4;
const FRAME_INTERVAL = 1000 / 30;

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
      const inward = 15 + columnRatio * Math.min(135, width * 0.078);
      const perspectiveX = depthRatio * 48;
      const perspectiveY = depthRatio * -18;
      const screenX = edge + side * (inward + perspectiveX);
      const screenY = baseY + perspectiveY;
      const distance = Math.hypot(pointer.x - screenX, pointer.y - screenY);
      const influence = pointer.active ? Math.max(0, 1 - distance / POINTER_RADIUS) : 0;
      const energy = influence * influence * (3 - 2 * influence);
      const direction = distance > 1 ? (screenY - pointer.y) / distance : 0;
      const breathing = reducedMotion.matches ? 0 : Math.sin(now * 0.00125 + row * 0.42 + layer) * 1.2;

      return {
        x: screenX + side * energy * (22 + depthRatio * 18),
        y: screenY + direction * energy * 22 + breathing * depthRatio,
        z: depthRatio,
        row,
        column,
        layer,
        energy,
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
        const energy = Math.max(segment.from.energy, segment.to.energy);
        const depthFade = 0.2 + (1 - segment.depth) * 0.8;
        const baseAlpha = segment.diagonal ? 0.075 : 0.1;
        context.beginPath();
        context.moveTo(segment.from.x, segment.from.y);
        context.lineTo(segment.to.x, segment.to.y);
        context.strokeStyle = energy > 0.015
          ? `rgba(102, 226, 255, ${(0.14 + energy * 0.42) * depthFade})`
          : `rgba(105, 174, 207, ${baseAlpha * depthFade})`;
        context.lineWidth = (segment.diagonal ? 0.55 : 0.72) + energy * 1.15;
        context.stroke();
      }

      points.sort((a, b) => b.z - a.z);
      for (const point of points) {
        const depthFade = 0.25 + (1 - point.z) * 0.75;
        context.beginPath();
        context.arc(point.x, point.y, 0.75 + point.energy * 2.25, 0, Math.PI * 2);
        context.fillStyle = point.energy > 0.015
          ? `rgba(151, 238, 255, ${(0.3 + point.energy * 0.62) * depthFade})`
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
      if (!reducedMotion.matches) frame = window.requestAnimationFrame(draw);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };
    const leave = () => { pointer.active = false; };

    resize();
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    if (reducedMotion.matches) draw(performance.now());
    else frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  return <canvas ref={canvasRef} className="edge-lattice" aria-hidden="true" />;
}
