"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Telemetry = {
  load: number;
  stress: number;
  status: "NOMINAL" | "CAUTION" | "CRITICAL";
};

const initialTelemetry: Telemetry = {
  load: 0,
  stress: 0,
  status: "NOMINAL",
};

export default function StructuralTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry>(initialTelemetry);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0
        ? Math.min(1, Math.max(0, window.scrollY / scrollable))
        : 0;
      const load = progress * 12;
      const stress = 248 * Math.pow(progress, 1.15);
      const status = stress >= 210
        ? "CRITICAL"
        : stress >= 155
          ? "CAUTION"
          : "NOMINAL";

      setTelemetry({ load, stress, status });
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div
        className={`telemetry telemetry-${telemetry.status.toLowerCase()}`}
        aria-label={`Structural telemetry: applied load ${telemetry.load.toFixed(2)} kilonewtons, von Mises stress ${telemetry.stress.toFixed(1)} megapascals, status ${telemetry.status.toLowerCase()}`}
      >
        <span><b>LOAD</b> {telemetry.load.toFixed(2)} KN</span>
        <span><b>&sigma;VM</b> {telemetry.stress.toFixed(1)} MPA</span>
        <span><b>STATE</b> {telemetry.status}</span>
      </div>
      {mounted && createPortal(
        <div
          className={`structural-vignette vignette-${telemetry.status.toLowerCase()}`}
          aria-hidden="true"
        />,
        document.body,
      )}
    </>
  );
}
