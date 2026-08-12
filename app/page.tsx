import StructuralTelemetry from "./StructuralTelemetry";
import FeaBackground from "./FeaBackground";
import ResearchCarousel from "./ResearchCarousel";
import LugCarousel from "./LugCarousel";
import AeroponicsGallery from "./AeroponicsGallery";
import RocketGallery from "./RocketGallery";
import TurbojetGallery from "./TurbojetGallery";
import ExcelCarousel from "./ExcelCarousel";

const projects = [
  {
    id: "research",
    stage: "Section 02 · Computational Research",
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
    stage: "Section 03 · Structural Design",
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
    stage: "Section 04 · Sustainable Systems",
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
    stage: "Section 05 · Flight Systems",
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
  {
    id: "turbojet",
    stage: "Section 06 · Propulsion Development",
    title: "Annular-combustor turbojet with lobed ejector augmentation",
    description:
      "An independent, in-progress turbojet project combining an annular combustion system with a lobed ejector concept for the exhaust and afterburner section. I am developing the flower-shaped ejector geometry to improve exhaust mixing and entrain additional ambient air while working through airflow, fuel delivery, flame stabilization, cooling, and dilution-zone decisions before fabrication and safe testing.",
    metrics: [
      ["Annular", "combustor architecture"],
      ["Lobed ejector", "augmentation concept"],
      ["In progress", "design status"],
    ],
    tags: ["Propulsion", "Combustor design", "Ejector augmentation", "Thermodynamics", "CAD", "Design calculations"],
    mediaLabel: "Turbojet design documentation coming next",
    mediaHint: "Combustor CAD · flow-path calculations · development progress",
  },
];

const experience = [
  {
    period: "2022 – Present",
    role: "Construction Project Assistant",
    place: "JCR Contractor LLC · Atlanta, Georgia",
    detail:
      "Built Excel calculators for project budgeting and payroll, automate payroll workflows, audit expenses, organize tax-season records, and plan expenditures around project budgets and tax treatment.",
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
    period: "2026 – Present",
    role: "Vice President",
    place: "Grow Together Organization (GTO)",
    detail:
      "Manage annual budgeting and funding documentation, helping increase available funding from approximately $500 to $900; support outreach to a 40-plus-member community and contribute to the design, assembly, and troubleshooting of the organization’s aeroponics system.",
  },
];

const skillGroups = [
  {
    index: "01",
    title: "CAD & Parametric Design",
    description: "Building parts, assemblies, and field-driven geometry for structures and flight hardware.",
    tools: ["SolidWorks", "Autodesk Inventor", "AutoCAD", "nTopology", "Parametric modeling"],
  },
  {
    index: "02",
    title: "Analysis & Computing",
    description: "Using simulation and code to evaluate designs, process data, and automate technical work.",
    tools: ["Basic FEA", "Python", "OpenCV", "C / C++", "Data analysis"],
  },
  {
    index: "03",
    title: "Research & Operations",
    description: "Turning experimental, financial, and project information into traceable decisions.",
    tools: ["Spartan", "Microsoft Excel", "Computational modeling", "Technical documentation"],
  },
  {
    index: "04",
    title: "Prototyping & Build",
    description: "Taking concepts into physical form through fabrication, assembly, and troubleshooting.",
    tools: ["3D printing", "Mechanical assembly", "Circuit troubleshooting", "Design validation"],
  },
];

export default function Home() {
  return (
    <main>
      <FeaBackground />
      <header className="mission-bar">
        <a className="wordmark" href="#launch" aria-label="Jaime Conde, return to top">
          J.C<span>{"//"}</span>STRUCTURAL PROFILE
        </a>
        <StructuralTelemetry />
      </header>

      <nav className="rail" aria-label="Page sections">
        <a href="#launch">01</a>
        <a href="#research">02</a>
        <a href="#design">03</a>
        <a href="#aeroponics">04</a>
        <a href="#rocket">05</a>
        <a href="#turbojet">06</a>
        <a href="#experience">07</a>
        <a href="#toolkit">08</a>
        <a href="#contact">09</a>
      </nav>

      <section className="hero shell" id="launch">
        <div className="hero-copy">
          <p className="eyebrow">01 / Georgia State University · Engineering Pathway · Aerospace</p>
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
            sustainable systems, student rocket structures, and early-stage propulsion design. I am preparing to transfer
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
            <a
              className="button"
              href="/portfolio/downloads/Jaime-Conde-Resume.pdf"
              download
            >
              Download résumé ↓
            </a>
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
              src="/portfolio/images/jaime-conde-headshot.webp"
              alt="Jaime Conde"
            />
          </div>
          <p>[ SUBJECT · J. CONDE · AEROSTRUCTURES ]</p>
        </div>
      </section>

      <nav className="trajectory shell" aria-label="Engineering workflow and project shortcuts">
        <a href="#research">
          <small>01 / INVESTIGATE</small>
          <strong>Research</strong>
          <span>Computational chemistry</span>
        </a>
        <i aria-hidden="true" />
        <a href="#design">
          <small>02 / DEVELOP</small>
          <strong>Analysis + Design</strong>
          <span>Stress-driven structures</span>
        </a>
        <i aria-hidden="true" />
        <a href="#aeroponics">
          <small>03 / VERIFY</small>
          <strong>Validation</strong>
          <span>Build and system testing</span>
        </a>
      </nav>

      {projects.map((project, index) => (
        <section className="project shell" id={project.id} key={project.title}>
          <div className="stage-label"><b>▮</b> {project.stage}</div>
          <div className="project-grid">
            <div>
              <p className="project-number">0{index + 2}</p>
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
          ) : project.id === "turbojet" ? (
            <TurbojetGallery />
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
          <p>07 / EXPERIENCE</p>
          <h2>Leading in the shop,<br />the field, and the classroom.</h2>
        </div>
        <div className="experience-grid">
          <aside className="experience-profile" aria-label="Experience profile summary">
            <p className="experience-profile-label">WORK PROFILE / 2022—2026</p>
            <strong>Technical work across four operating environments.</strong>
            <p>
              Applying engineering thinking beyond coursework through project operations,
              student leadership, aerospace outreach, and hands-on development.
            </p>
            <div className="experience-domains" aria-label="Experience areas">
              <span><b>01</b> Operations</span>
              <span><b>02</b> Leadership</span>
              <span><b>03</b> Outreach</span>
              <span><b>04</b> Engineering</span>
            </div>
            <article className="excel-sample">
              <div className="excel-sample-heading">
                <span>FEATURED WORK SAMPLE</span>
                <b>XLSX</b>
              </div>
              <ExcelCarousel />
              <div className="excel-sample-copy">
                <h3>Cash-Flow & Payroll Allocation Calculator</h3>
                <p>
                  A sanitized Excel model built to turn recorded income into budget,
                  payroll, tax-reserve, and annual projection decisions.
                </p>
                <ul>
                  <li>Linked assumptions and allocation formulas</li>
                  <li>Reserve safeguards and annual projections</li>
                  <li>Seasonal income tracking and charts</li>
                </ul>
              </div>
              <a className="excel-download" href="/portfolio/downloads/Cash-Allocation-Portfolio-Sample.xlsx" download>
                <span>Download sanitized workbook</span>
                <b aria-hidden="true">↓</b>
              </a>
            </article>
          </aside>
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
        </div>
      </section>

      <section className="payload shell" id="toolkit">
        <div className="section-heading toolkit-heading">
          <div className="toolkit-heading-copy">
            <p>08 / METHODS / TOOLKIT</p>
            <p className="toolkit-intro">
              My toolkit spans the full development loop—from modeling and analysis to
              documentation, fabrication, and hands-on validation.
            </p>
          </div>
          <h2>Tools for turning questions into testable designs.</h2>
        </div>
        <div className="toolkit-grid">
          {skillGroups.map((group) => (
            <article className="toolkit-card" key={group.title}>
              <div className="toolkit-card-heading">
                <span>{group.index}</span>
                <h3>{group.title}</h3>
              </div>
              <p>{group.description}</p>
              <ul>
                {group.tools.map((tool) => <li key={tool}>{tool}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="contact shell" id="contact">
        <p className="eyebrow">09 / CONTACT · Next iteration · New collaboration</p>
        <h2>Let’s build something that earns its way onto the aircraft.</h2>
        <p>
          Open to undergraduate research, aerospace design projects, and engineering
          opportunities in the Atlanta area.
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a className="button primary" href="mailto:jaime.conde.acos@gmail.com">Email me</a>
          <a className="button" href="https://www.linkedin.com/in/jaime-conde1/" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
        <div className="contact-meta">
          <span>Jaime Conde</span><span>Atlanta, Georgia</span><span>English · Español</span>
        </div>
      </section>

      <footer className="shell">
        <span>© 2026 Jaime Conde</span>
        <a href="#launch">Return to top ↑</a>
      </footer>
    </main>
  );
}
