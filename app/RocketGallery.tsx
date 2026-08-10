const base = "/jaime-conde-portfolio/images/";

const views = [
  {
    src: `${base}Cross Section Cone.png`,
    alt: "Dimensioned Autodesk Inventor cross-section of the IREC rocket nose cone",
    label: "01 · Profile geometry",
    caption: "My dimensioned nose-cone design",
    className: "rocket-view rocket-view-profile",
  },
  {
    src: `${base}Assembly.png`,
    alt: "Team rocket assembly showing the nose cone and integrated avionics bay",
    label: "02 · Team integration context",
    caption: "Nose cone within the team rocket assembly",
    className: "rocket-view",
  },
  {
    src: `${base}Avionics_Bay.png`,
    alt: "Team rendering of the IREC rocket avionics bay",
    label: "03 · Team system context",
    caption: "Internal avionics-bay arrangement",
    className: "rocket-view",
  },
];

export default function RocketGallery() {
  return (
    <figure className="rocket-gallery" aria-labelledby="rocket-gallery-title">
      <div className="rocket-gallery-heading">
        <div>
          <span className="gallery-label">CAD DESIGN RECORD / IREC 10K COTS</span>
          <h3 id="rocket-gallery-title">Nose-cone design within the full rocket assembly</h3>
        </div>
        <p>
          My Autodesk Inventor nose-cone model is shown alongside team assembly and avionics
          views to document its integration context without overstating my individual scope.
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
