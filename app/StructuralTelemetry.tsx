"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Telemetry = {
  elapsed: number;
  section: number;
  load: number;
  stress: number;
  status: "NOMINAL" | "CAUTION" | "CRITICAL";
};

const initialTelemetry: Telemetry = {
  elapsed: 0,
  section: 1,
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

    const update = () => {
      const now = performance.now();
      const elapsed = (now - start) / 1000;
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

      // Simulated cyclic axial load. Stress is calculated as sigma = Kt(F/A),
      // using a 68 mm^2 effective section and a 1.32 stress concentration factor.
      const baseLoad = section <= 4
        ? 2.4 + (section - 1) * 1.3
        : section <= 6
          ? 7.8 + (section - 5) * 1.15
          : 10.15 + (section - 7) * 0.62;
      const cyclicLoad = 0.28 * Math.sin(elapsed * 1.15)
        + 0.09 * Math.sin(elapsed * 2.7 + section);
      const load = Math.max(0, baseLoad + cyclicLoad);
      const stress = 1.32 * ((load * 1000) / 68);

      setTelemetry({ elapsed, section, load, stress, status });
    };

    update();
    const interval = window.setInterval(update, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <>
      <div
        className={`telemetry telemetry-${telemetry.status.toLowerCase()}`}
        aria-label={`Mission elapsed time ${formatElapsed(telemetry.elapsed)}. Section ${telemetry.section}. Structural telemetry: applied load ${telemetry.load.toFixed(2)} kilonewtons, calculated stress ${telemetry.stress.toFixed(1)} megapascals, status ${telemetry.status.toLowerCase()}`}
      >
        <span className="telemetry-time"><b>T+</b>{formatElapsed(telemetry.elapsed)}</span>
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
