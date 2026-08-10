const base = "/jaime-conde-portfolio/images/";

const views = [
  {
    src: `${base}Cross Section Cone.png`,
    alt: "Dimensioned SolidWorks cross-section of the IREC rocket nose cone and transition geometry",
    label: "01 · Profile geometry",
    caption: "Dimensioned nose-cone and transition profile",
    className: "rocket-view rocket-view-profile",
  },
  {
    src: `${base}Assembly.png`,
    alt: "Transparent SolidWorks assembly showing the rocket nose cone and integrated avionics bay",
    label: "02 · Structural integration",
    caption: "Nose-cone, transition, and avionics assembly",
    className: "rocket-view",
  },
  {
    src: `${base}Avionics_Bay.png`,
    alt: "Detailed SolidWorks rendering of the IREC rocket avionics bay",
    label: "03 · Avionics packaging",
    caption: "Internal avionics-bay component arrangement",
    className: "rocket-view",
  },
];

export default function RocketGallery() {
  return (
    <figure className="rocket-gallery" aria-labelledby="rocket-gallery-title">
      <div className="rocket-gallery-heading">
        <div>
          <span className="gallery-label">CAD DESIGN RECORD / IREC 10K COTS</span>
          <h3 id="rocket-gallery-title">From profile geometry to integrated flight hardware</h3>
        </div>
        <p>
          Three SolidWorks views document the nose-cone profile, full structural assembly,
          and avionics packaging without cropping the tall geometry.
        </p>
      </div>

      <div className="rocket-gallery-grid">
        {views.map((view) => (
          <article className={view.className} key={view.src}>
            <div className="rocket-image-frame">
              <img src={view.src} alt={view.alt} />
            </div>
            <div className="rocket-view-caption">
              <span>{view.label}</span>
              <strong>{view.caption}</strong>
            </div>
          </article>
        ))}
      </div>
    </figure>
  );
}
