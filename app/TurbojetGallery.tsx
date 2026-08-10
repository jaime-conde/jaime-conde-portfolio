const views = [
  {
    className: "turbojet-view turbojet-view-angled",
    src: "/jaime-conde-portfolio/images/Angled View (1).jpg",
    alt: "Angled CAD render of the small turbojet annular combustor assembly",
    label: "Assembly perspective",
    detail: "Angled view of the developing turbojet and annular combustor packaging",
  },
  {
    className: "turbojet-view",
    src: "/jaime-conde-portfolio/images/Ignition section view (1).jpg",
    alt: "Sectioned CAD render showing the ignition region of the annular combustor",
    label: "Ignition section",
    detail: "Section view of the flame-tube geometry and ignition-region layout",
  },
  {
    className: "turbojet-view",
    src: "/jaime-conde-portfolio/images/Render view 6 (Exhaust view)-1_edited_edited.jpg",
    alt: "Cutaway CAD render viewed from the exhaust end of the turbojet",
    label: "Exhaust-end cutaway",
    detail: "Internal packaging and flow-path context viewed from the exhaust end",
  },
];

export default function TurbojetGallery() {
  return (
    <div className="turbojet-gallery" aria-label="Turbojet annular combustor CAD views">
      <div className="turbojet-gallery-heading">
        <div>
          <span className="gallery-label">CAD DEVELOPMENT / IN PROGRESS</span>
          <h3>Combustor geometry and engine integration</h3>
        </div>
        <p>
          Three complementary renders document the current geometry. Fabrication,
          combustion testing, and performance validation remain future work.
        </p>
      </div>
      <div className="turbojet-gallery-grid">
        {views.map((view) => (
          <figure className={view.className} key={view.src}>
            <div className="turbojet-image-frame">
              <img src={view.src} alt={view.alt} />
            </div>
            <figcaption>
              <span>{view.label}</span>
              <strong>{view.detail}</strong>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
