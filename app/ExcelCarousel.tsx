"use client";

import { useState } from "react";

const sheets = [
  { src: "/jaime-conde-portfolio/images/excel-dashboard.webp", name: "Dashboard", alt: "Excel dashboard showing cash allocation assumptions and annual projections" },
  { src: "/jaime-conde-portfolio/images/excel-annual-inputs.webp", name: "Annual Inputs", alt: "Excel annual inputs sheet for cash-flow planning" },
  { src: "/jaime-conde-portfolio/images/excel-check-allocator.webp", name: "Check Allocator", alt: "Excel check allocation calculator with linked budgeting formulas" },
  { src: "/jaime-conde-portfolio/images/excel-spending-tracker.webp", name: "Spending Tracker", alt: "Excel spending tracker with seasonal income and temperature charts" },
  { src: "/jaime-conde-portfolio/images/excel-lists.webp", name: "Lists", alt: "Excel reference lists used by the calculator's lookup formulas" },
];

export default function ExcelCarousel() {
  const [active, setActive] = useState(0);
  const move = (direction: number) => setActive((current) => (current + direction + sheets.length) % sheets.length);

  return (
    <div className="excel-carousel" aria-roledescription="carousel" aria-label="Excel calculator workbook sheets" tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}>
      <div className="excel-preview">
        <div className="excel-track" style={{ transform: `translateX(-${active * 100}%)` }}>
          {sheets.map((sheet, index) => (
            <figure key={sheet.name} aria-hidden={active !== index}>
              <img src={sheet.src} alt={sheet.alt} />
            </figure>
          ))}
        </div>
        <button className="excel-arrow excel-arrow-prev" type="button" onClick={() => move(-1)} aria-label="Show previous workbook sheet">‹</button>
        <button className="excel-arrow excel-arrow-next" type="button" onClick={() => move(1)} aria-label="Show next workbook sheet">›</button>
      </div>
      <div className="excel-carousel-meta" aria-live="polite">
        <span>{String(active + 1).padStart(2, "0")} / {String(sheets.length).padStart(2, "0")}</span>
        <strong>{sheets[active].name}</strong>
        <div className="excel-dots" aria-label="Choose a workbook sheet">
          {sheets.map((sheet, index) => (
            <button key={sheet.name} type="button" className={active === index ? "active" : ""} onClick={() => setActive(index)} aria-label={`Show ${sheet.name} sheet`} aria-current={active === index ? "true" : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
