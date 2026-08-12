"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; z: number; row: number; column: number };

const MIN_WIDTH = 820;
const POINTER_RADIUS = 190;

export default function EdgeLattice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const pointer = { x: -1000, y: -1000, active: false };
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;

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

    const projectedNodes = (side: -1 | 1, now: number) => {
      const nodes: Node[] = [];
      const band = Math.min(154, Math.max(96, width * 0.09));
      const origin = side < 0 ? 0 : width;
      const rows = Math.ceil(height / 34) + 2;
      const columns = 5;

      for (let row = -1; row < rows; row += 1) {
        const y = row * 34;
        const densityWave = 0.82 + 0.22 * Math.sin(row * 0.72);
        for (let column = 0; column < columns; column += 1) {
          const depth = column / (columns - 1);
          const baseX = origin + side * band * depth * densityWave;
          const stagger = (row % 2 ? 0.5 : 0) * 28 * depth;
          const baseY = y + stagger;
          const dx = pointer.x - baseX;
          const dy = pointer.y - baseY;
          const distance = Math.hypot(dx, dy);
          const influence = pointer.active ? Math.max(0, 1 - distance / POINTER_RADIUS) : 0;
          const eased = influence * influence * (3 - 2 * influence);
          const breathing = reducedMotion.matches ? 0 : Math.sin(now * 0.0015 + row * 0.35) * 1.4;

          nodes.push({
            x: baseX - side * eased * (18 + depth * 30),
            y: baseY + (distance > 1 ? (baseY - pointer.y) / distance : 0) * eased * 18 + breathing * depth,
            z: eased,
            row,
            column,
          });
        }
      }
      return nodes;
    };

    const drawSide = (side: -1 | 1, now: number) => {
      const nodes = projectedNodes(side, now);
      const lookup = new Map(nodes.map((node) => [`${node.row}:${node.column}`, node]));

      const connect = (from: Node, row: number, column: number) => {
        const to = lookup.get(`${row}:${column}`);
        if (!to) return;
        const energy = Math.max(from.z, to.z);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle = energy > 0.02
          ? `rgba(81, 220, 255, ${0.14 + energy * 0.42})`
          : "rgba(97, 163, 196, 0.12)";
        context.lineWidth = 0.65 + energy * 0.9;
        context.stroke();
      };

      for (const node of nodes) {
        connect(node, node.row + 1, node.column);
        connect(node, node.row, node.column + 1);
        connect(node, node.row + 1, node.column + (node.row % 2 ? -1 : 1));
      }

      for (const node of nodes) {
        context.beginPath();
        context.arc(node.x, node.y, 0.8 + node.z * 2.1, 0, Math.PI * 2);
        context.fillStyle = node.z > 0.02
          ? `rgba(135, 235, 255, ${0.28 + node.z * 0.58})`
          : "rgba(160, 211, 236, 0.20)";
        context.fill();
      }
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height);
      if (desktop.matches) {
        drawSide(-1, now);
        drawSide(1, now);
      }
      if (!reducedMotion.matches) frame = window.requestAnimationFrame(draw);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
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
