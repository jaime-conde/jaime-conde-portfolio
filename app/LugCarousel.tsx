const basePath = "/jaime-conde-portfolio/images/";

export default function LugCarousel() {
  return (
    <figure className="lug-composite" aria-labelledby="lug-composite-caption">
      <div className="lug-composite-frame">
        <img
          src={`${basePath}lug-design-progression.webp`}
          alt="Five-panel progression showing the baseline lug, von Mises stress result, optimized geometry, lattice cross-section, and distance-field cross-section"
        />
      </div>
      <figcaption id="lug-composite-caption">
        <span className="gallery-label">OPTIMIZATION RESULTS</span>
        <div className="lug-results">
          <div><strong>43.0058 g</strong><span>Weight reduction</span></div>
          <div><strong>21.1%</strong><span>Improvement</span></div>
        </div>
        <p>Stress-driven progression from the baseline solid lug to the variable-density lattice geometry.</p>
      </figcaption>
    </figure>
  );
}
