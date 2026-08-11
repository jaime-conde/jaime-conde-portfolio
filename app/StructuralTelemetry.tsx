"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Telemetry = {
  elapsed: number;
  section: number;
  velocity: number;
  load: number;
  stress: number;
  status: "NOMINAL" | "CAUTION" | "CRITICAL";
};

const initialTelemetry: Telemetry = {
  elapsed: 0,
  section: 1,
  velocity: 0,
  load: 0,
  stress: 0,
  status: "NOMINAL",
};

const sectionIds = [
  "launch",
  "research",
  "design",
  "aeroponics",
  "rocket",
  "turbojet",
  "experience",
  "toolkit",
  "contact",
];

const formatElapsed = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return [hours, minutes, remainingSeconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
};

export default function StructuralTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry>(initialTelemetry);

  useEffect(() => {
    const start = performance.now();
    let previousTime = start;
    let previousScrollY = window.scrollY;
    let velocity = 0;
    let previousVelocity = 0;
    let acceleration = 0;
    let lastRender = 0;
    let frame = 0;

    const update = (now: number) => {
      const elapsed = (now - start) / 1000;
      const deltaTime = Math.max((now - previousTime) / 1000, 0.001);
      const deltaScroll = window.scrollY - previousScrollY;

      // Treat page movement as a virtual instrumented carriage. Scroll position
      // is converted to metres, then differentiated and smoothed so the values
      // react to the visitor without amplifying single-frame browser noise.
      const measuredVelocity = Math.max(-6, Math.min(6, (deltaScroll * 0.0015) / deltaTime));
      const velocityBlend = deltaScroll === 0 ? 0.08 : 0.24;
      velocity += (measuredVelocity - velocity) * velocityBlend;
      const measuredAcceleration = (velocity - previousVelocity) / deltaTime;
      acceleration += (Math.max(-30, Math.min(30, measuredAcceleration)) - acceleration) * 0.16;

      previousTime = now;
      previousScrollY = window.scrollY;
      previousVelocity = velocity;

      const probe = window.scrollY + window.innerHeight * 0.42;
      let section = 1;

      sectionIds.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element && element.offsetTop <= probe) section = index + 1;
      });

      const status = section >= 7
        ? "CRITICAL"
        : section >= 5
          ? "CAUTION"
          : "NOMINAL";

      // Scroll acceleration drives inertial load through F = ma. The specimen
      // keeps one constant preload everywhere on the page; section depth changes
      // only the displayed state and vignette, never the mechanical values.
      // Stress follows sigma = Kt(F/A), with A = 68 mm^2 and Kt = 1.32.
      const preload = 2.2;
      const effectiveMass = 260;
      const inertialLoad = (effectiveMass * Math.abs(acceleration)) / 1000;
      const load = preload + inertialLoad;
      const stress = 1.32 * ((load * 1000) / 68);

      if (now - lastRender >= 80) {
        lastRender = now;
        setTelemetry({ elapsed, section, velocity, load, stress, status });
      }

      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div
        className={`telemetry telemetry-${telemetry.status.toLowerCase()}`}
        aria-label={`Mission elapsed time ${formatElapsed(telemetry.elapsed)}. Section ${telemetry.section}. Scroll velocity ${telemetry.velocity.toFixed(2)} metres per second. Inertial load ${telemetry.load.toFixed(2)} kilonewtons, calculated stress ${telemetry.stress.toFixed(1)} megapascals, status ${telemetry.status.toLowerCase()}`}
      >
        <span className="telemetry-time"><b>T+</b>{formatElapsed(telemetry.elapsed)}</span>
        <span className="telemetry-velocity"><b>VEL</b> {telemetry.velocity.toFixed(2)} M/S</span>
        <span><b>LOAD</b> {telemetry.load.toFixed(2)} KN</span>
        <span><b>&sigma;</b> {telemetry.stress.toFixed(1)} MPA</span>
        <span><b>STATE</b> {telemetry.status}</span>
      </div>
      {typeof document !== "undefined" && createPortal(
        <div
          className={`structural-vignette vignette-${telemetry.status.toLowerCase()}`}
          aria-hidden="true"
        />,
        document.body,
      )}
    </>
  );
}
