"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

type Telemetry = {
  elapsed: number;
  section: number;
  velocity: number;
  acceleration: number;
  load: number;
  stress: number;
  status: "NOMINAL" | "CAUTION" | "CRITICAL";
};

const initialTelemetry: Telemetry = {
  elapsed: 0,
  section: 1,
  velocity: 0,
  acceleration: 0,
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
    let displayedLoad = 0;
    let displayedStatus: Telemetry["status"] = "NOMINAL";
    let holdUntil = 0;
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

      // Scroll acceleration drives inertial load through F = ma. There is no
      // static preload, so the mechanical values settle to zero at rest.
      // Stress follows sigma = Kt(F/A), with A = 68 mm^2 and Kt = 1.32.
      const effectiveMass = 190;
      const targetLoad = (effectiveMass * Math.abs(acceleration)) / 1000;

      // Model a damped instrument instead of exposing noisy frame-by-frame
      // acceleration. Peaks rise smoothly, hold briefly, then decay slowly so
      // the structural state is visible rather than flashing past.
      const isRising = targetLoad > displayedLoad;
      if (isRising) holdUntil = now + 650;
      const timeConstant = isRising ? 0.14 : now < holdUntil ? Infinity : 1.8;
      const loadBlend = Number.isFinite(timeConstant)
        ? 1 - Math.exp(-deltaTime / timeConstant)
        : 0;
      displayedLoad += (targetLoad - displayedLoad) * loadBlend;
      if (displayedLoad < 0.002 && targetLoad < 0.002) displayedLoad = 0;

      const load = displayedLoad;
      const stress = 1.32 * ((load * 1000) / 68);

      // Hysteresis prevents the state from flickering when stress sits close
      // to a threshold. Entry remains 50/80 MPa; exit requires a clear drop.
      if (displayedStatus === "CRITICAL") {
        if (stress < 74) displayedStatus = stress > 50 ? "CAUTION" : "NOMINAL";
      } else if (displayedStatus === "CAUTION") {
        if (stress > 80) displayedStatus = "CRITICAL";
        else if (stress < 44) displayedStatus = "NOMINAL";
      } else if (stress > 80) {
        displayedStatus = "CRITICAL";
      } else if (stress > 50) {
        displayedStatus = "CAUTION";
      }

      const displayedAcceleration = load === 0 ? 0 : (load * 1000) / effectiveMass;

      if (now - lastRender >= 80) {
        lastRender = now;
        setTelemetry({
          elapsed,
          section,
          velocity,
          acceleration: displayedAcceleration,
          load,
          stress,
          status: displayedStatus,
        });
      }

      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const vignetteStrength = telemetry.stress > 80
    ? Math.min(0.72, 0.54 + (telemetry.stress - 80) / 300)
    : telemetry.stress > 50
      ? 0.38 + ((telemetry.stress - 50) / 30) * 0.14
      : 0.18 + (telemetry.stress / 50) * 0.14;

  return (
    <>
      <div
        className={`telemetry telemetry-${telemetry.status.toLowerCase()}`}
        aria-label={`Mission elapsed time ${formatElapsed(telemetry.elapsed)}. Section ${telemetry.section}. Scroll velocity ${telemetry.velocity.toFixed(2)} metres per second. Acceleration ${telemetry.acceleration.toFixed(2)} metres per second squared. Inertial load ${telemetry.load.toFixed(2)} kilonewtons, calculated stress ${telemetry.stress.toFixed(1)} megapascals, status ${telemetry.status.toLowerCase()}`}
      >
        <div className="telemetry-readouts">
          <span className="telemetry-time"><b>T+</b>{formatElapsed(telemetry.elapsed)}</span>
          <span className="telemetry-velocity"><b>VEL</b> {telemetry.velocity.toFixed(2)} M/S</span>
          <span><b>LOAD</b> {telemetry.load.toFixed(2)} KN</span>
          <span><b>&sigma;</b> {telemetry.stress.toFixed(1)} MPA</span>
          <span><b>STATE</b> {telemetry.status}</span>
        </div>
        <div className="telemetry-equation" aria-hidden="true">
          <span>F = m|a| = 190 kg &times; {Math.abs(telemetry.acceleration).toFixed(2)} m/s&sup2; = {(telemetry.load * 1000).toFixed(0)} N</span>
          <span>&sigma; = K<sub>t</sub>F/A = 1.32 &times; {(telemetry.load * 1000).toFixed(0)} N / 68 mm&sup2; = {telemetry.stress.toFixed(1)} MPa</span>
        </div>
      </div>
      {typeof document !== "undefined" && createPortal(
        <div
          className={`structural-vignette vignette-${telemetry.status.toLowerCase()}`}
          style={{ "--vignette-opacity": vignetteStrength } as CSSProperties}
          aria-hidden="true"
        />,
        document.body,
      )}
    </>
  );
}
