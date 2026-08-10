import StructuralTelemetry from "./StructuralTelemetry";
import ResearchCarousel from "./ResearchCarousel";
import LugCarousel from "./LugCarousel";
import AeroponicsGallery from "./AeroponicsGallery";
import RocketGallery from "./RocketGallery";

const projects = [
  {
    id: "research",
    stage: "Stage 01 · Computational Research",
    title: "Modeling the chemistry behind polymer materials",
    description:
      "Computational research with Dr. Dutta using Spartan, PM3, and density functional theory to study ethylene-polymerization catalysts. I analyze transition-state geometry, electrostatic potential, stereochemistry, and infrared spectra to connect catalyst behavior with polymer formation and properties.",
    metrics: [
      ["PM3 + DFT", "modeling methods"],
      ["Group 4", "catalyst chemistry"],
      ["SURS", "2026 presentation"],
    ],
    tags: ["Spartan", "Computational chemistry", "Data analysis", "Scientific communication"],
    mediaLabel: "Add research image",
    mediaHint: "Molecular model · results plot · SURS poster",
  },
  {
    id: "design",
    stage: "Stage 02 · Structural Design",
    title: "Lightweighting a lug with stress-driven lattice density",
    description:
      "An independent data-driven CAD project exploring a variable-density lattice inside a load-bearing lug. I evaluated pin loading, bearing stresses, and stress concentrations, then prepared the design for additive manufacturing and developed a physical comparison test against a fully solid component.",
    metrics: [
      ["nTop", "field-driven design"],
      ["FEA", "structural evaluation"],
      ["A/B", "lattice vs. solid test"],
    ],
    tags: ["nTopology", "Basic FEA", "Additive manufacturing", "Parametric modeling"],
    mediaLabel: "Add project image",
    mediaHint: "FEA contour · lattice model · printed prototype",
  },
  {
    id: "aeroponics",
    stage: "Stage 03 · Sustainable Systems",
    title: "Designing a modular, replicable aeroponic system",
    description:
      "Designed modular food-grade PETG components and supported construction, documentation, purchasing, and replication planning for a low-cost aeroponic tower. The team organized the build around a six-week schedule, documented risks and responsibilities, and tested automation while developing a sustainability-focused system intended to address food insecurity.",
    metrics: [
      ["$646", "estimated total cost"],
      ["$301", "remaining after supplies"],
      ["6 weeks", "planned build schedule"],
    ],
    tags: ["CAD design", "3D printing", "Budget planning", "Team organization", "Sustainability"],
    mediaLabel: "Add system image",
    mediaHint: "CAD assembly · printed components · completed system",
  },
  {
    id: "rocket",
    stage: "Stage 04 · Flight Systems",
    title: "Designing the nose cone for an IREC 10k COTS rocket",
    description:
      "Designed the rocket nose cone in Autodesk Inventor and served as design lead for a six-person team within Rocket Tech GSU's 20-plus-member club. I coordinated design work and supported the nose cone's integration with the rocket assembly for the IREC 10k COTS competition.",
    metrics: [
      ["10k", "competition class"],
      ["6", "design team members"],
      ["20+", "club members"],
    ],
    tags: ["Autodesk Inventor", "Nose-cone design", "Design leadership", "Rocket integration"],
    mediaLabel: "Add rocket image",
    mediaHint: "Inventor model · assembly context · avionics layout",
  },
];

const experience = [
  {
    period: "2022 – Present",
    role: "Construction Project Assistant",
    place: "JCR Contractor LLC · Atlanta, Georgia",
    detail:
      "Manage project budgets, pay applications, purchases, and expense tracking; coordinate crews of 5–10, schedules, deliveries, and communication between field teams and project managers; and support estimates and financial planning.",
  },
  {
    period: "Summer 2026",
    role: "STEP Camp Mentor",
    place: "Georgia Tech · Atlanta, Georgia",
    detail:
      "Supported students during rover construction, circuit assembly, troubleshooting, and hands-on engineering activities while maintaining safe workspaces and keeping teams on schedule.",
  },
  {
    period: "2025 – Present",
    role: "Project Lead",
    place: "Rocket Tech GSU",
    detail:
      "Coordinate documentation, team assignments, and rocket-development activities for a 20-plus-member student engineering organization.",
  },
  {
    period: "2025",
    role: "Vice President",
    place: "Perimeter Motorsports",
    detail:
      "Supported project planning, member coordination, and mechanical development for the student go-kart program.",
  },
];

const skills = [
  "SolidWorks",
  "Autodesk Inventor",
  "AutoCAD",
  "nTopology",
  "Basic FEA",
  "Parametric modeling",
  "Python",
  "OpenCV",
  "C / C++",
  "3D printing",
  "Mechanical assembly",
  "Technical documentation",
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
        <a href="#aeroponics">04</a>
        <a href="#rocket">05</a>
        <a href="#experience">06</a>
        <a href="#contact">07</a>
      </nav>

      <section className="hero shell" id="launch">
        <div className="hero-copy">
          <p className="eyebrow">Georgia State University · Engineering Pathway · Aerospace</p>
          <h1>
            Jaime Conde.<br />
            Engineering for <em>flight.</em>
          </h1>
          <p className="lede">
            Aerospace engineering student using computational research, structural design,
            and hands-on prototyping to turn technical questions into testable systems.
          </p>
          <p className="intro">
            My work spans molecular catalyst modeling, stress-driven lightweighting,
            sustainable systems, and student rocket structures. I am preparing to transfer
            in Spring 2027 and pursue aerospace research in aerostructures and advanced
            manufacturing.
          </p>
          <div className="status-row">
            <span>3.7 GPA</span><span>2026 SURS Presenter</span><span>STEP Mentor</span>
            <span>REP</span><span>HOPE Scholar</span>
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
              src="/jaime-conde-portfolio/images/jaime-conde-headshot.webp"
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
        <section className="project shell" id={project.id} key={project.title}>
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
          {project.id === "research" ? (
            <ResearchCarousel />
          ) : project.id === "design" ? (
            <LugCarousel />
          ) : project.id === "aeroponics" ? (
            <AeroponicsGallery />
          ) : project.id === "rocket" ? (
            <RocketGallery />
          ) : (
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
          )}
        </section>
      ))}

      <section className="experience shell" id="experience">
        <div className="stage-label"><b>▮</b> Development · Experience & Leadership</div>
        <div className="section-heading">
          <p>06 / EXPERIENCE</p>
          <h2>Leading in the shop,<br />the field, and the classroom.</h2>
        </div>
        <div className="timeline">
          {experience.map((item) => (
            <article key={`${item.period}-${item.role}`}>
              <time>{item.period}</time>
              <div>
                <h3>{item.role}</h3>
                <p className="place">{item.place}</p>
