"use client";

import { useCallback, useEffect, useState } from "react";

const base = "/portfolio/images/";

const slides = [
  {
    src: `${base}aeroponic-seedlings-results.webp`,
    alt: "Side-by-side comparison of newly transplanted lettuce and the mature aeroponic tower results",
    title: "Seedlings to results",
    detail: "A side-by-side view of the tower after transplanting and after sustained plant growth.",
  },
  {
    src: `${base}aeroponic-automation-landscape.webp`,
    alt: "Automation hardware being tested on the aeroponic tower",
    title: "In progress",
    detail: "Aeroponics automation prototype integrating pH, EC/TDS, and water-temperature sensors with an OLED interface for nutrient monitoring and setup validation.",
  },
];

export default function AeroponicsGallery() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const move = useCallback((direction: number) => {
    setActive((current) => (current + direction + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => move(1), 6000);
    return () => window.clearInterval(timer);
  }, [move, paused]);

  return (
    <div className="aeroponics-showcase">
      <section
        className="aeroponics-gallery"
        aria-label="Aeroponic system project gallery"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
      >
        <div className="aeroponics-viewport">
          <div className="aeroponics-track" style={{ transform: `translateX(-${active * 100}%)` }}>
            {slides.map((slide) => (
              <figure className="aeroponics-slide" key={slide.src}>
                <img src={slide.src} alt={slide.alt} />
              </figure>
            ))}
          </div>
          <button className="carousel-arrow carousel-prev" type="button" onClick={() => move(-1)} aria-label="Previous project image">‹</button>
          <button className="carousel-arrow carousel-next" type="button" onClick={() => move(1)} aria-label="Next project image">›</button>
          <span className="aeroponics-counter">0{active + 1} / 0{slides.length}</span>
        </div>
        <div className="carousel-meta">
          <div>
            <span className="gallery-label">BUILD PROGRESSION</span>
            <strong>{slides[active].title}</strong>
            <small>{slides[active].detail}</small>
          </div>
          <div className="carousel-dots" aria-label="Choose project image">
            {slides.map((slide, index) => (
              <button
                className={index === active ? "active" : ""}
                type="button"
                key={slide.src}
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1}: ${slide.title}`}
                aria-current={index === active ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="project-document" aria-labelledby="aeroponics-document-title">
        <div className="project-document-heading">
          <div>
            <span className="gallery-label">PROJECT DOCUMENTATION</span>
            <h3 id="aeroponics-document-title">Planning, budget, and build organization</h3>
            <p>Eight-slide project deck covering the bill of materials, purchasing status, six-week schedule, risks, team responsibilities, tools, and sponsorship opportunities.</p>
          </div>
          <div className="document-actions">
            <a href={`${base}aeroponic-project-presentation.pdf`} download>Download PDF</a>
            <a href={`${base}aeroponic-project-presentation.pptx`} download>Download PowerPoint</a>
          </div>
        </div>
        <iframe
          className="project-document-viewer"
          src={`${base}aeroponic-project-presentation.pdf#view=FitH`}
          title="Aeroponic project planning and budget presentation"
        />
        <p className="document-note">Scroll through the presentation above, or download the PDF or editable PowerPoint.</p>
      </section>
    </div>
  );
}
