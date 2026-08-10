"use client";

import { useEffect, useState } from "react";

const posterUrl =
  "/jaime-conde-portfolio/images/Computational%20analysis%20of%20metal%20effects%20on%20ethylene%20insertion%20in%20Group%204%20metallocene%20analogs.pdf";

export default function ResearchCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const slideCount = 2;

  useEffect(() => {
    if (isInteracting) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slideCount);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [isInteracting]);

  const move = (direction: number) => {
    setActiveSlide((current) => (current + direction + slideCount) % slideCount);
  };

  return (
    <div
      className="research-carousel"
      aria-roledescription="carousel"
      aria-label="Dr. Dutta research and SURS presentation"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
      tabIndex={0}
    >
      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          <article
            className="carousel-slide poster-slide"
            aria-hidden={activeSlide !== 0}
            aria-label="Research poster, slide 1 of 2"
            onPointerEnter={() => setIsInteracting(true)}
            onPointerLeave={() => setIsInteracting(false)}
            onFocusCapture={() => setIsInteracting(true)}
            onBlurCapture={() => setIsInteracting(false)}
          >
            <object
              className="poster-viewer"
              data={`${posterUrl}#zoom=page-width&toolbar=0&navpanes=0`}
              type="application/pdf"
              aria-label="Scrollable computational analysis research poster preview"
              tabIndex={activeSlide === 0 ? 0 : -1}
            >
              <a href={posterUrl} download="Jaime-Conde-SURS-Research-Poster.pdf">
                Download the research poster
              </a>
            </object>
          </article>

          <figure
            className="carousel-slide presentation-slide"
            aria-hidden={activeSlide !== 1}
            aria-label="SURS presentation photo, slide 2 of 2"
          >
            <img
              src="/jaime-conde-portfolio/images/SURS%20Poster%20image.png"
              alt="Jaime Conde presenting computational chemistry research at the 2026 Summer Undergraduate Research Symposium"
            />
          </figure>
        </div>

        <button
          className="carousel-arrow carousel-prev"
          type="button"
          onClick={() => move(-1)}
          aria-label="Show previous image"
        >
          ‹
        </button>
        <button
          className="carousel-arrow carousel-next"
          type="button"
          onClick={() => move(1)}
          aria-label="Show next image"
        >
          ›
        </button>
      </div>

      <div className="carousel-meta">
        <div>
          <span className="gallery-label">
            {activeSlide === 0 ? "01 / RESEARCH POSTER" : "02 / SURS 2026"}
          </span>
          <strong>
            {activeSlide === 0
              ? "Computational Analysis of Group 4 Metallocene Analogs"
              : "Presenting at the Summer Undergraduate Research Symposium"}
          </strong>
          <small>
            {activeSlide === 0 ? (
              <a
                className="poster-download-link"
                href={posterUrl}
                download="Jaime-Conde-SURS-Research-Poster.pdf"
              >
                Click here to download the poster
              </a>
            ) : (
              "Summer Undergraduate Research Symposium · 2026"
            )}
          </small>
        </div>

        <div className="carousel-dots" aria-label="Choose a gallery slide">
          {[0, 1].map((slide) => (
            <button
              key={slide}
              type="button"
              className={activeSlide === slide ? "active" : ""}
              onClick={() => setActiveSlide(slide)}
              aria-label={`Show slide ${slide + 1}`}
              aria-current={activeSlide === slide ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
