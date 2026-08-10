"use client";

import { useEffect, useState } from "react";

const basePath = "/jaime-conde-portfolio/images/";

const slides = [
  { file: "Base Lug.jfif", title: "Baseline lug geometry", detail: "Original solid geometry used to establish the loading case." },
  { file: "Base Lug Von Misses Stress.jfif", title: "Von Mises stress result", detail: "Stress distribution used to identify where material carries the load." },
  { file: "Lug Optimization Values.jfif", title: "Optimization field values", detail: "Field data used to drive the variable-density design." },
  { file: "Base Double Lug Optimized Geometry.jfif", title: "Optimized double-lug geometry", detail: "Completed lightweight structure with material concentrated along the load path." },
  { file: "Base Double Lug Optimized Geometry Cross-Section.jfif", title: "Lattice cross-section", detail: "Internal view of the optimized lattice-filled structure." },
  { file: "Base Double Lug Optimized Geometry Distance Field Closs-Section.jfif", title: "Distance-field cross-section", detail: "Cross-section showing how the field varies lattice density through the part." },
];

export default function LugCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const move = (direction: number) => {
    setActive((value) => (value + direction + slides.length) % slides.length);
  };

  return (
    <div
      className="lug-carousel"
      aria-label="Lattice lug design gallery"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="lug-viewport">
        <div className="lug-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {slides.map((slide) => (
            <figure className="lug-slide" key={slide.file}>
              <img src={`${basePath}${encodeURIComponent(slide.file)}`} alt={slide.title} />
            </figure>
          ))}
        </div>
        <button className="carousel-arrow carousel-prev" type="button" onClick={() => move(-1)} aria-label="Previous lug image">‹</button>
        <button className="carousel-arrow carousel-next" type="button" onClick={() => move(1)} aria-label="Next lug image">›</button>
        <span className="lug-counter">{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
      </div>
      <div className="carousel-meta">
        <div>
          <span className="gallery-label">DESIGN PROGRESSION</span>
          <strong>{slides[active].title}</strong>
          <small>{slides[active].detail}</small>
        </div>
        <div className="carousel-dots" aria-label="Choose lug gallery image">
          {slides.map((slide, index) => (
            <button
              className={index === active ? "active" : ""}
              type="button"
              key={slide.file}
              onClick={() => setActive(index)}
              aria-label={`Show ${slide.title}`}
              aria-current={index === active ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
