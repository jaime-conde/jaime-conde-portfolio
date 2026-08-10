import StructuralTelemetry from "./StructuralTelemetry";

const projects = [
  {
    stage: "Stage 01 · Computational Research",
    title: "Modeling the chemistry behind better materials",
    description:
      "Computational chemistry research with Dr. Dutta using Spartan to study Group 4 metallocene catalysts for ethylene polymerization. I compare transition-state geometry, metal–carbon bond distances, electrostatic potential, and vibrational spectra to understand how catalyst structure shapes reactivity.",
    metrics: [
      ["3", "transition metals compared"],
      ["DFT", "electronic structure method"],
      ["SURS", "2026 research presentation"],
    ],
    tags: ["Spartan", "Density functional theory", "Data analysis", "Scientific communication"],
    mediaLabel: "Add research image",
    mediaHint: "Molecular model · results plot · SURS poster",
  },
  {
    stage: "Stage 02 · Generative Design",
    title: "Lightweighting a structural lug with field-driven design",
    description:
      "An independent nTop project exploring a variable-density octet lattice inside a load-bearing lug. The lattice responds to the stress field so material is concentrated where the part needs it and removed where it does not—connecting simulation, manufacturability, and physical testing.",
    metrics: [
      ["Octet", "lattice architecture"],
      ["FEA", "stress-guided density"],
      ["PLA", "prototype material"],
    ],
    tags: ["nTop", "FEA", "Additive manufacturing", "Design optimization"],
    mediaLabel: "Add project image",
    mediaHint: "FEA contour · lattice model · printed prototype",
  },
  {
    stage: "Stage 03 · Engineering Outreach",
    title: "Helping younger students find their direction",
    description:
      "After attending Georgia Tech’s STEP program in 2024, I returned as a mentor in 2026. I supported students as they built rovers, debugged circuits, and translated unfamiliar engineering ideas into working hardware. I am continuing that mission through GOT Space K–12 outreach.",
    metrics: [
      ["2 wks", "STEP day camp mentored"],
      ["K–12", "students reached"],
      ["1→1", "participant to mentor"],
    ],
    tags: ["STEM outreach", "Mentoring", "Circuits", "Rover assembly"],
    mediaLabel: "Add outreach image",
    mediaHint: "STEP camp · rover build · GOT Space event",
  },
];

const experience = [
  {
    period: "2026 – Present",
    role: "Undergraduate Researcher",
    place: "Georgia State University · Department of Chemistry",
    detail:
      "Investigating catalyst structures and transition states for ethylene polymerization through computational modeling and comparative molecular analysis.",
  },
  {
    period: "Summer 2026",
    role: "STEP Mentor",
    place: "Georgia Tech · K–12 Aerospace Engineering Outreach",
    detail:
      "Guided students through rover construction, circuit troubleshooting, and collaborative engineering challenges during a two-week summer program.",
  },
  {
    period: "2025 – Present",
    role: "Vice President",
    place: "Grow Together Organization · GSU Perimeter",
    detail:
      "Managed budgets, meetings, annual funding, member outreach, and hands-on hydroponics assembly and troubleshooting.",
  },
  {
    period: "2022 – Present",
    role: "Operations & Finance Assistant",
    place: "JCR Contractor LLC",
    detail:
      "Automate payroll workflows, audit expenses, organize tax-season records, and plan expenditures around project budgets and tax treatment.",
  },
];

const skills = [
  "SolidWorks",
  "Autodesk Inventor",
  "nTop",
  "Python",
  "FEA fundamentals",
  "Spartan",
  "Technical writing",
  "Data analysis",
];

export default function Home() {
  return (
    <main>
      <header className="mission-bar">
        <a className="wordmark" href="#launch" aria-label="Jaime Conde, return to top">
          J.C<span>//</span>STRUCTURAL PROFILE
        </a>
        <StructuralTelemetry />
      </header>

      <nav className="rail" aria-label="Page sections">
        <a href="#launch">01</a>
        <a href="#research">02</a>
        <a href="#design">03</a>
        <a href="#outreach">04</a>
        <a href="#experience">05</a>
        <a href="#contact">06</a>
      </nav>

      <section className="hero shell" id="launch">
        <div className="hero-copy">
          <p className="eyebrow">Georgia State University · Engineering Pathway · Aerospace</p>
          <h1>
            Jaime Conde.<br />
            Engineering for <em>flight.</em>
          </h1>
          <p className="lede">
            Engineering student exploring how lighter structures, computational research,
            and better design decisions can move aerospace systems forward.
          </p>
          <p className="intro">
            I work at the intersection of modeling and making—from studying molecular
            catalysts and stress-driven lattices to mentoring students as they turn circuits
            and code into working rovers. I am preparing to transfer into aerospace engineering
            and pursue research in aerostructures and advanced manufacturing.
          </p>
          <div className="status-row">
            <span>3.7 GPA</span><span>2026 SURS Presenter</span><span>STEP Mentor</span>
          </div>
          <div className="hero-actions">
            <a className="button primary" href="#research">Explore projects</a>
            <a className="button" href="#experience">View experience</a>
          </div>
        </div>

        <div className="portrait-wrap">
          <div className="analysis-frame" aria-hidden="true">
            <span className="frame-corner frame-tl" />
            <span className="frame-corner frame-tr" />
            <span className="frame-corner frame-bl" />
            <span className="frame-corner frame-br" />
          </div>
          <div className="stress-contour" aria-hidden="true" />
          <div className="portrait">
            <img
              src="/images/jaime-conde-headshot.png"
              alt="Jaime Conde"
            />
          </div>
          <p>[ SUBJECT · J. CONDE · AEROSTRUCTURES ]</p>
        </div>
      </section>

      <div className="trajectory shell" aria-hidden="true">
        <span>RESEARCH</span><i /><span>ANALYSIS + DESIGN</span><i /><span>VALIDATION</span>
      </div>

      {projects.map((project, index) => (
        <section
          className="project shell"
          id={index === 0 ? "research" : index === 1 ? "design" : "outreach"}
          key={project.title}
        >
          <div className="stage-label"><b>▮</b> {project.stage}</div>
          <div className="project-grid">
            <div>
              <p className="project-number">0{index + 1}</p>
              <h2>{project.title}</h2>
            </div>
            <div className="project-body">
              <p>{project.description}</p>
              <div className="metrics">
                {project.metrics.map(([value, label]) => (
                  <div key={label}><strong>{value}</strong><span>{label}</span></div>
                ))}
              </div>
              <div className="tags">
                {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </div>
          </div>
          <div className="project-media" aria-label={`${project.mediaLabel} placeholder`}>
            <div className="media-corners" aria-hidden="true" />
            <span className="media-index">IMG / 0{index + 1}</span>
            <div className="media-prompt">
              <span className="media-plus" aria-hidden="true">+</span>
              <strong>{project.mediaLabel}</strong>
              <small>{project.mediaHint}</small>
            </div>
            <span className="media-format">16:9 · JPG / PNG / WEBP</span>
          </div>
        </section>
      ))}

      <section className="experience shell" id="experience">
        <div className="stage-label"><b>▮</b> Development · Experience Log</div>
        <div className="section-heading">
          <p>05 / EXPERIENCE</p>
          <h2>Learning in the lab,<br />the shop, and the field.</h2>
        </div>
        <div className="timeline">
          {experience.map((item) => (
            <article key={`${item.period}-${item.role}`}>
              <time>{item.period}</time>
              <div>
                <h3>{item.role}</h3>
                <p className="place">{item.place}</p>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="payload shell">
        <div className="section-heading">
          <p>METHODS / TOOLKIT</p>
          <h2>Tools for turning questions into testable designs.</h2>
        </div>
        <div className="skill-grid">
          {skills.map((skill, index) => <span key={skill}><b>0{index + 1}</b>{skill}</span>)}
        </div>
      </section>

      <section className="contact shell" id="contact">
        <p className="eyebrow">Next iteration · New collaboration</p>
        <h2>Let’s build something that earns its way onto the aircraft.</h2>
        <p>
          Open to undergraduate research, aerospace design projects, and engineering
          opportunities in the Atlanta area.
        </p>
        <div className="contact-meta">
          <span>Jaime Conde</span><span>Lawrenceville, Georgia</span><span>English · Español</span>
        </div>
      </section>

      <footer className="shell">
        <span>© 2026 Jaime Conde</span>
        <a href="#launch">Return to top ↑</a>
      </footer>
    </main>
  );
}
