const basePath = "/portfolio/images/";

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
          <div><strong>203.82 g</strong><span>Baseline mass</span></div>
          <div><strong>160.81 g</strong><span>Optimized mass</span></div>
          <div><strong>43.01 g</strong><span>Mass removed</span></div>
          <div><strong>21.10%</strong><span>Mass reduction</span></div>
          <div className="lug-result-wide" style={{ gridColumn: "1 / -1" }}>
            <strong>6061-T6</strong><span>Aluminum material model</span>
          </div>
        </div>
        <p>
          Stress-driven progression from the baseline solid lug to a variable-density lattice geometry,
          evaluated using 6061-T6 aluminum material properties. Baseline and optimized masses are inferred
          from the recorded 43.01 g reduction and 21.10% mass reduction.
        </p>
      </figcaption>
    </figure>
  );
}
