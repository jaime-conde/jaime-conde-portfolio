"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "./LanguageProvider";

type Telemetry = {
  elapsed: number;
  section: number;
  velocity: number;
  acceleration: number;
  load: number;
  stress: number;
  visualStress: number;
  status: "NOMINAL" | "CAUTION" | "CRITICAL";
};

const initialTelemetry: Telemetry = {
  elapsed: 0,
  section: 1,
  velocity: 0,
  acceleration: 0,
  load: 0,
  stress: 0,
  visualStress: 0,
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
  const { language } = useLanguage();

  useEffect(() => {
    const start = performance.now();
    let previousTime = start;
    let previousScrollY = window.scrollY;
    let velocity = 0;
    let previousVelocity = 0;
    let acceleration = 0;
    let visualStress = 0;
    let displayedStatus: Telemetry["status"] = "NOMINAL";
    let cautionHoldUntil = 0;
    let criticalHoldUntil = 0;
    let lastRender = 0;
    let frame = 0;
    let previousTouchY: number | null = null;
    let previousTouchTime = 0;
    let touchVelocity = 0;
    let lastTouchSample = 0;

    // Normalize pixel movement to a reference viewport so the same relative
    // gesture produces comparable telemetry on phones, tablets, and desktops.
    // Coarse-pointer devices receive a modest sensitivity correction because
    // touch browsers report fewer motion samples than wheels and trackpads.
    const getMotionScale = () => {
      const viewportHeight = Math.max(
        window.visualViewport?.height ?? window.innerHeight,
        480,
      );
      const viewportScale = 900 / viewportHeight;
      const touchSampleCorrection = window.matchMedia("(pointer: coarse)").matches
        ? 1.35
        : 1;

      return Math.max(0.85, Math.min(1.7, viewportScale * touchSampleCorrection));
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      previousTouchY = touch.clientY;
      previousTouchTime = performance.now();
      touchVelocity = 0;
      lastTouchSample = previousTouchTime;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || previousTouchY === null) return;

      const now = performance.now();
      const touchDeltaTime = Math.max((now - previousTouchTime) / 1000, 0.001);
      const estimatedScrollDelta = previousTouchY - touch.clientY;

      // Mobile browsers may throttle scroll-position updates while a finger is
      // down. Measure the gesture directly so touch scrolling drives the same
      // virtual carriage model as a mouse wheel or trackpad.
      touchVelocity = Math.max(
        -6,
        Math.min(6, (estimatedScrollDelta * 0.0015 * getMotionScale()) / touchDeltaTime),
      );
      previousTouchY = touch.clientY;
      previousTouchTime = now;
      lastTouchSample = now;
    };

    const onTouchEnd = () => {
      previousTouchY = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    const update = (now: number) => {
      const elapsed = (now - start) / 1000;
      const deltaTime = Math.max((now - previousTime) / 1000, 0.001);
      const deltaScroll = window.scrollY - previousScrollY;

      // Treat page movement as a virtual instrumented carriage. Scroll position
      // is converted to metres, then differentiated and smoothed so the values
      // react to the visitor without amplifying single-frame browser noise.
      const scrollVelocity = Math.max(
        -6,
        Math.min(6, (deltaScroll * 0.0015 * getMotionScale()) / deltaTime),
      );
      const hasRecentTouchSample = now - lastTouchSample < 100;
      const measuredVelocity = hasRecentTouchSample ? touchVelocity : scrollVelocity;
      const hasMovement = hasRecentTouchSample || deltaScroll !== 0;
      const velocityBlend = hasMovement ? 0.24 : 0.08;
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
      const load = (effectiveMass * Math.abs(acceleration)) / 1000;
      const stress = 1.32 * ((load * 1000) / 68);

      // Keep the measured force and stress immediate, and give only the visual
      // warning layer severity-dependent persistence. Nominal responds with no
      // added delay. Caution lingers long enough to be readable, while critical
      // releases sooner so the strongest warning does not dominate the page.
      if (stress >= visualStress) {
        visualStress = stress;
        if (stress >= 105) criticalHoldUntil = now + 350;
        else if (stress >= 75) cautionHoldUntil = now + 500;
      } else if (stress < 75 && visualStress < 105) {
        const blend = now < cautionHoldUntil
          ? 0
          : 1 - Math.exp(-deltaTime / 1.4);
        visualStress += (stress - visualStress) * blend;
      } else {
        const isCriticalVisual = visualStress >= 105;
        const timeConstant = isCriticalVisual ? 0.75 : 1.4;
        const blend = now < criticalHoldUntil && isCriticalVisual
          ? 0
          : 1 - Math.exp(-deltaTime / timeConstant);
        visualStress += (stress - visualStress) * blend;
      }
      if (visualStress < 0.1 && stress < 0.1) visualStress = 0;

      // Hysteresis prevents the state from flickering when stress sits close
      // to a threshold. Entry is 75/105 MPa; exit requires a clear drop.
      if (displayedStatus === "CRITICAL") {
        if (visualStress < 97) displayedStatus = visualStress >= 75 ? "CAUTION" : "NOMINAL";
      } else if (displayedStatus === "CAUTION") {
        if (visualStress >= 105) displayedStatus = "CRITICAL";
        else if (visualStress < 67) displayedStatus = "NOMINAL";
      } else if (visualStress >= 105) {
        displayedStatus = "CRITICAL";
      } else if (visualStress >= 75) {
        displayedStatus = "CAUTION";
      }

      const displayedAcceleration = load < 0.002 ? 0 : (load * 1000) / effectiveMass;

      if (now - lastRender >= 80) {
        lastRender = now;
        setTelemetry({
          elapsed,
          section,
          velocity,
          acceleration: displayedAcceleration,
          load,
          stress,
          visualStress,
          status: displayedStatus,
        });
      }

      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const baseVignetteStrength = telemetry.visualStress >= 105
    ? Math.min(0.50, 0.38 + (telemetry.visualStress - 105) / 500)
    : telemetry.visualStress >= 75
      ? 0.24 + ((telemetry.visualStress - 75) / 30) * 0.10
      : 0.10 + (telemetry.visualStress / 75) * 0.08;
  const vignetteStrength = baseVignetteStrength * 0.85;
  const isSpanish = language === "es";
  const statusLabel = isSpanish
    ? ({ NOMINAL: "NOMINAL", CAUTION: "PRECAUCIÓN", CRITICAL: "CRÍTICO" } as const)[telemetry.status]
    : telemetry.status;
  const telemetryLabel = isSpanish
    ? `Tiempo transcurrido ${formatElapsed(telemetry.elapsed)}. Sección ${telemetry.section}. Velocidad de desplazamiento ${telemetry.velocity.toFixed(2)} metros por segundo. Aceleración ${telemetry.acceleration.toFixed(2)} metros por segundo al cuadrado. Carga inercial ${telemetry.load.toFixed(2)} kilonewtons, esfuerzo calculado ${telemetry.stress.toFixed(1)} megapascales, estado ${statusLabel.toLowerCase()}`
    : `Mission elapsed time ${formatElapsed(telemetry.elapsed)}. Section ${telemetry.section}. Scroll velocity ${telemetry.velocity.toFixed(2)} metres per second. Acceleration ${telemetry.acceleration.toFixed(2)} metres per second squared. Inertial load ${telemetry.load.toFixed(2)} kilonewtons, calculated stress ${telemetry.stress.toFixed(1)} megapascals, status ${statusLabel.toLowerCase()}`;

  return (
    <>
      <div
        className={`telemetry telemetry-${telemetry.status.toLowerCase()}`}
        aria-label={telemetryLabel}
      >
        <div className="telemetry-readouts">
          <span className="telemetry-time"><b>T+</b>{formatElapsed(telemetry.elapsed)}</span>
          <span className="telemetry-velocity"><b>VEL</b> {telemetry.velocity.toFixed(2)} M/S</span>
          <span><b>{isSpanish ? "CARGA" : "LOAD"}</b> {telemetry.load.toFixed(2)} KN</span>
          <span><b className="stress-symbol" aria-label={isSpanish ? "sigma, esfuerzo normal" : "sigma, normal stress"}>σ</b> {telemetry.stress.toFixed(1)} MPA</span>
          <span><b>{isSpanish ? "ESTADO" : "STATE"}</b> {statusLabel}</span>
        </div>
        <div className="telemetry-equation" aria-hidden="true">
          <span>F = m|a| = 190 kg &times; {Math.abs(telemetry.acceleration).toFixed(2)} m/s&sup2; = {(telemetry.load * 1000).toFixed(0)} N</span>
          <span>σ = K<sub>t</sub>F/A = 1.32 &times; {(telemetry.load * 1000).toFixed(0)} N / 68 mm&sup2; = {telemetry.stress.toFixed(1)} MPa</span>
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
