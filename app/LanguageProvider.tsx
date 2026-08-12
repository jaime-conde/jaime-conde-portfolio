"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "es";

const spanish: Record<string, string> = {
  "Page sections": "Secciones de la página",
  "Jaime Conde, return to top": "Jaime Conde, volver al inicio",
  "STRUCTURAL PROFILE": "PERFIL ESTRUCTURAL",
  "Georgia State University · Engineering Pathway · Aerospace": "Georgia State University · Trayectoria de Ingeniería · Aeroespacial",
  "Engineering for": "Ingeniería para el",
  "flight.": "vuelo.",
  "Aerospace engineering student using computational research, structural design, and hands-on prototyping to turn technical questions into testable systems.": "Estudiante de ingeniería aeroespacial que utiliza investigación computacional, diseño estructural y prototipado práctico para convertir preguntas técnicas en sistemas comprobables.",
  "My work spans molecular catalyst modeling, stress-driven lightweighting, sustainable systems, student rocket structures, and early-stage propulsion design. I am preparing to transfer in Spring 2027 and pursue aerospace research in aerostructures and advanced manufacturing.": "Mi trabajo abarca el modelado molecular de catalizadores, el aligeramiento guiado por esfuerzos, sistemas sostenibles, estructuras de cohetes estudiantiles y diseño inicial de propulsión. Me estoy preparando para transferirme en la primavera de 2027 y realizar investigación aeroespacial en aeroestructuras y manufactura avanzada.",
  "2026 SURS Presenter": "Presentador SURS 2026",
  "STEP Mentor": "Mentor STEP",
  "HOPE Scholar": "Becario HOPE",
  "Explore projects": "Explorar proyectos",
  "View experience": "Ver experiencia",
  "Download résumé ↓": "Descargar currículum ↓",
  "Engineering workflow and project shortcuts": "Flujo de ingeniería y accesos a proyectos",
  "INVESTIGATE": "INVESTIGAR",
  "Research": "Investigación",
  "Computational chemistry": "Química computacional",
  "DEVELOP": "DESARROLLAR",
  "Analysis + Design": "Análisis + Diseño",
  "Stress-driven structures": "Estructuras guiadas por esfuerzos",
  "VERIFY": "VERIFICAR",
  "Validation": "Validación",
  "Build and system testing": "Construcción y pruebas del sistema",
  "Section 02 · Computational Research": "Sección 02 · Investigación Computacional",
  "Modeling the chemistry behind polymer materials": "Modelando la química detrás de los materiales poliméricos",
  "Computational research with Dr. Dutta using Spartan, PM3, and density functional theory to study ethylene-polymerization catalysts. I analyze transition-state geometry, electrostatic potential, stereochemistry, and infrared spectra to connect catalyst behavior with polymer formation and properties.": "Investigación computacional con la Dra. Dutta utilizando Spartan, PM3 y teoría del funcional de la densidad para estudiar catalizadores de polimerización del etileno. Analizo la geometría del estado de transición, el potencial electrostático, la estereoquímica y los espectros infrarrojos para relacionar el comportamiento del catalizador con la formación y las propiedades del polímero.",
  "modeling methods": "métodos de modelado", "catalyst chemistry": "química de catalizadores", "2026 presentation": "presentación 2026",
  "Data analysis": "Análisis de datos", "Scientific communication": "Comunicación científica",
  "Section 03 · Structural Design": "Sección 03 · Diseño Estructural",
  "Lightweighting a lug with stress-driven lattice density": "Aligeramiento de una orejeta con densidad reticular guiada por esfuerzos",
  "An independent data-driven CAD project exploring a variable-density lattice inside a load-bearing lug. I evaluated pin loading, bearing stresses, and stress concentrations, then prepared the design for additive manufacturing and developed a physical comparison test against a fully solid component.": "Proyecto CAD independiente y basado en datos que explora una retícula de densidad variable dentro de una orejeta de carga. Evalué la carga del pasador, los esfuerzos de apoyo y las concentraciones de esfuerzo; después preparé el diseño para manufactura aditiva y desarrollé una prueba física comparativa frente a un componente completamente sólido.",
  "field-driven design": "diseño guiado por campos", "structural evaluation": "evaluación estructural", "lattice vs. solid test": "prueba retícula vs. sólido",
  "Basic FEA": "FEA básico", "Additive manufacturing": "Manufactura aditiva", "Parametric modeling": "Modelado paramétrico",
  "Section 04 · Sustainable Systems": "Sección 04 · Sistemas Sostenibles",
  "Designing a modular, replicable aeroponic system": "Diseño de un sistema aeropónico modular y replicable",
  "Designed modular food-grade PETG components and supported construction, documentation, purchasing, and replication planning for a low-cost aeroponic tower. The team organized the build around a six-week schedule, documented risks and responsibilities, and tested automation while developing a sustainability-focused system intended to address food insecurity.": "Diseñé componentes modulares de PETG de grado alimentario y apoyé la construcción, documentación, compras y planificación de réplica de una torre aeropónica de bajo costo. El equipo organizó la construcción en un plazo de seis semanas, documentó riesgos y responsabilidades, y probó la automatización mientras desarrollaba un sistema sostenible destinado a abordar la inseguridad alimentaria.",
  "estimated total cost": "costo total estimado", "remaining after supplies": "restante después de materiales", "planned build schedule": "cronograma de construcción",
  "CAD design": "Diseño CAD", "3D printing": "Impresión 3D", "Budget planning": "Planificación presupuestaria", "Team organization": "Organización de equipo", "Sustainability": "Sostenibilidad",
  "Section 05 · Flight Systems": "Sección 05 · Sistemas de Vuelo",
  "Designing the nose cone for an IREC 10k COTS rocket": "Diseño del cono de nariz para un cohete IREC 10k COTS",
  "Designed the rocket nose cone in Autodesk Inventor and served as design lead for a six-person team within Rocket Tech GSU's 20-plus-member club. I coordinated design work and supported the nose cone's integration with the rocket assembly for the IREC 10k COTS competition.": "Diseñé el cono de nariz del cohete en Autodesk Inventor y fui líder de diseño de un equipo de seis personas dentro de Rocket Tech GSU, un club de más de 20 miembros. Coordiné el trabajo de diseño y apoyé la integración del cono con el ensamblaje del cohete para la competencia IREC 10k COTS.",
  "competition class": "clase de competencia", "design team members": "miembros del equipo de diseño", "club members": "miembros del club",
  "Nose-cone design": "Diseño de cono de nariz", "Design leadership": "Liderazgo de diseño", "Rocket integration": "Integración de cohete",
  "Section 06 · Propulsion Development": "Sección 06 · Desarrollo de Propulsión",
  "Annular-combustor turbojet with lobed ejector augmentation": "Turborreactor de combustor anular con aumento por eyector lobulado",
  "An independent, in-progress turbojet project combining an annular combustion system with a lobed ejector concept for the exhaust and afterburner section. I am developing the flower-shaped ejector geometry to improve exhaust mixing and entrain additional ambient air while working through airflow, fuel delivery, flame stabilization, cooling, and dilution-zone decisions before fabrication and safe testing.": "Proyecto independiente de turborreactor en desarrollo que combina un sistema de combustión anular con un concepto de eyector lobulado para la sección de escape y postcombustión. Estoy desarrollando la geometría del eyector en forma de flor para mejorar la mezcla del escape y arrastrar aire ambiente adicional, mientras resuelvo decisiones sobre flujo de aire, suministro de combustible, estabilización de llama, enfriamiento y zona de dilución antes de la fabricación y las pruebas seguras.",
  "combustor architecture": "arquitectura del combustor", "augmentation concept": "concepto de aumento", "design status": "estado del diseño", "In progress": "En desarrollo",
  "Combustor design": "Diseño de combustor", "Ejector augmentation": "Aumento por eyector", "Thermodynamics": "Termodinámica", "Design calculations": "Cálculos de diseño",
  "Development · Experience & Leadership": "Desarrollo · Experiencia y Liderazgo",
  "EXPERIENCE": "EXPERIENCIA", "Leading in the shop,": "Liderando en el taller,", "the field, and the classroom.": "el campo y el aula.",
  "Experience profile summary": "Resumen del perfil de experiencia", "WORK PROFILE / 2022—2026": "PERFIL LABORAL / 2022—2026",
  "Technical work across four operating environments.": "Trabajo técnico en cuatro entornos operativos.",
  "Applying engineering thinking beyond coursework through project operations, student leadership, aerospace outreach, and hands-on development.": "Aplicando el pensamiento de ingeniería más allá de los cursos mediante operaciones de proyectos, liderazgo estudiantil, divulgación aeroespacial y desarrollo práctico.",
  "Experience areas": "Áreas de experiencia", "Operations": "Operaciones", "Leadership": "Liderazgo", "Outreach": "Divulgación", "Engineering": "Ingeniería",
  "FEATURED WORK SAMPLE": "MUESTRA DE TRABAJO DESTACADA", "Cash-Flow & Payroll Allocation Calculator": "Calculadora de flujo de caja y asignación de nómina",
  "A sanitized Excel model built to turn recorded income into budget, payroll, tax-reserve, and annual projection decisions.": "Un modelo de Excel depurado que convierte los ingresos registrados en decisiones de presupuesto, nómina, reserva fiscal y proyecciones anuales.",
  "Linked assumptions and allocation formulas": "Supuestos vinculados y fórmulas de asignación", "Reserve safeguards and annual projections": "Protecciones de reserva y proyecciones anuales", "Seasonal income tracking and charts": "Seguimiento de ingresos estacionales y gráficas", "Download sanitized workbook": "Descargar libro depurado",
  "Construction Project Assistant": "Asistente de Proyectos de Construcción", "STEP Camp Mentor": "Mentor del Campamento STEP", "Project Lead": "Líder de Proyecto", "Vice President": "Vicepresidente",
  "Built Excel calculators for project budgeting and payroll, automate payroll workflows, audit expenses, organize tax-season records, and plan expenditures around project budgets and tax treatment.": "Creé calculadoras de Excel para presupuestos de proyectos y nómina; automatizo flujos de nómina, audito gastos, organizo registros para la temporada fiscal y planifico gastos según los presupuestos y el tratamiento tributario.",
  "Supported students during rover construction, circuit assembly, troubleshooting, and hands-on engineering activities while maintaining safe workspaces and keeping teams on schedule.": "Apoyé a estudiantes durante la construcción de rovers, el ensamblaje de circuitos, la resolución de problemas y actividades prácticas de ingeniería, manteniendo espacios seguros y a los equipos dentro del cronograma.",
  "Coordinate documentation, team assignments, and rocket-development activities for a 20-plus-member student engineering organization.": "Coordino documentación, asignaciones de equipo y actividades de desarrollo de cohetes para una organización estudiantil de ingeniería de más de 20 miembros.",
  "Manage annual budgeting and funding documentation, helping increase available funding from approximately $500 to $900; support outreach to a 40-plus-member community and contribute to the design, assembly, and troubleshooting of the organization’s aeroponics system.": "Gestiono el presupuesto anual y la documentación de financiamiento, ayudando a aumentar los fondos disponibles de aproximadamente $500 a $900; apoyo la divulgación a una comunidad de más de 40 miembros y contribuyo al diseño, ensamblaje y solución de problemas del sistema aeropónico de la organización.",
  "METHODS / TOOLKIT": "MÉTODOS / HERRAMIENTAS",
  "My toolkit spans the full development loop—from modeling and analysis to documentation, fabrication, and hands-on validation.": "Mis herramientas abarcan todo el ciclo de desarrollo: desde el modelado y análisis hasta la documentación, fabricación y validación práctica.",
  "Tools for turning questions into testable designs.": "Herramientas para convertir preguntas en diseños comprobables.",
  "CAD & Parametric Design": "CAD y Diseño Paramétrico", "Building parts, assemblies, and field-driven geometry for structures and flight hardware.": "Construcción de piezas, ensamblajes y geometría guiada por campos para estructuras y hardware de vuelo.",
  "Analysis & Computing": "Análisis y Computación", "Using simulation and code to evaluate designs, process data, and automate technical work.": "Uso de simulación y código para evaluar diseños, procesar datos y automatizar trabajo técnico.",
  "Research & Operations": "Investigación y Operaciones", "Turning experimental, financial, and project information into traceable decisions.": "Conversión de información experimental, financiera y de proyectos en decisiones trazables.",
  "Prototyping & Build": "Prototipado y Construcción", "Taking concepts into physical form through fabrication, assembly, and troubleshooting.": "Conversión de conceptos en formas físicas mediante fabricación, ensamblaje y resolución de problemas.",
  "Mechanical assembly": "Ensamblaje mecánico", "Circuit troubleshooting": "Diagnóstico de circuitos", "Design validation": "Validación de diseño", "Technical documentation": "Documentación técnica", "Computational modeling": "Modelado computacional",
  "CONTACT · Next iteration · New collaboration": "CONTACTO · Próxima iteración · Nueva colaboración",
  "Let’s build something that earns its way onto the aircraft.": "Construyamos algo que se gane su lugar en la aeronave.",
  "Open to undergraduate research, aerospace design projects, and engineering opportunities in the Atlanta area.": "Disponible para investigación de pregrado, proyectos de diseño aeroespacial y oportunidades de ingeniería en el área de Atlanta.",
  "Email me": "Envíame un correo", "English · Español": "Inglés · Español", "Return to top ↑": "Volver al inicio ↑",
  "OPTIMIZATION RESULTS": "RESULTADOS DE OPTIMIZACIÓN", "Baseline mass": "Masa inicial", "Optimized mass": "Masa optimizada", "Mass removed": "Masa eliminada", "Mass reduction": "Reducción de masa", "Aluminum material model": "Modelo de material de aluminio",
  "Stress-driven progression from the baseline solid lug to a variable-density lattice geometry, evaluated using 6061-T6 aluminum material properties. Baseline and optimized masses are inferred from the recorded 43.01 g reduction and 21.10% mass reduction.": "Progresión guiada por esfuerzos desde la orejeta sólida inicial hasta una geometría reticular de densidad variable, evaluada con propiedades de aluminio 6061-T6. Las masas inicial y optimizada se infieren de la reducción registrada de 43.01 g y 21.10 %.",
  "BUILD PROGRESSION": "PROGRESO DE CONSTRUCCIÓN", "Seedlings to results": "De plántulas a resultados", "A side-by-side view of the tower after transplanting and after sustained plant growth.": "Vista comparativa de la torre después del trasplante y tras un crecimiento sostenido.", "Automation attempt": "Prueba de automatización", "Testing the controls and hardware intended to automate system operation.": "Prueba de los controles y el hardware destinados a automatizar el funcionamiento del sistema.",
  "PROJECT DOCUMENTATION": "DOCUMENTACIÓN DEL PROYECTO", "Planning, budget, and build organization": "Planificación, presupuesto y organización de la construcción", "Eight-slide project deck covering the bill of materials, purchasing status, six-week schedule, risks, team responsibilities, tools, and sponsorship opportunities.": "Presentación de ocho diapositivas sobre materiales, estado de compras, cronograma de seis semanas, riesgos, responsabilidades, herramientas y oportunidades de patrocinio.", "Download PDF": "Descargar PDF", "Download PowerPoint": "Descargar PowerPoint", "Scroll through the presentation above, or download the PDF or editable PowerPoint.": "Recorre la presentación o descarga el PDF o PowerPoint editable.",
  "CAD DESIGN RECORD / IREC 10K COTS": "REGISTRO DE DISEÑO CAD / IREC 10K COTS", "Nose-cone design within the full rocket assembly": "Diseño del cono de nariz dentro del ensamblaje completo", "My Autodesk Inventor nose-cone model is shown alongside team assembly and avionics views to document its integration context without overstating my individual scope.": "Mi modelo del cono de nariz en Autodesk Inventor se muestra junto con vistas del ensamblaje y la aviónica del equipo para documentar su integración sin exagerar mi contribución individual.",
  "Profile geometry": "Geometría del perfil", "My dimensioned nose-cone design": "Mi diseño dimensionado del cono de nariz", "Team integration context": "Contexto de integración del equipo", "Nose cone within the team rocket assembly": "Cono de nariz dentro del ensamblaje del equipo", "Team system context": "Contexto del sistema del equipo", "Internal avionics-bay arrangement": "Distribución interna de la bahía de aviónica",
  "CAD DEVELOPMENT / IN PROGRESS": "DESARROLLO CAD / EN PROGRESO", "Combustor geometry and engine integration": "Geometría del combustor e integración del motor", "Three complementary renders document the current geometry. Fabrication, combustion testing, and performance validation remain future work.": "Tres renders complementarios documentan la geometría actual. La fabricación, las pruebas de combustión y la validación de rendimiento son trabajo futuro.",
  "Assembly perspective": "Perspectiva del ensamblaje", "Angled view of the developing turbojet and annular combustor packaging": "Vista angular del turborreactor en desarrollo y del empaquetado del combustor anular", "Ignition section": "Sección de encendido", "Section view of the flame-tube geometry and ignition-region layout": "Vista seccionada de la geometría del tubo de llama y la zona de encendido", "Exhaust-end cutaway": "Corte desde el escape", "Internal packaging and flow-path context viewed from the exhaust end": "Empaquetado interno y trayectoria de flujo vistos desde el escape",
  "RESEARCH POSTER": "PÓSTER DE INVESTIGACIÓN", "Computational Analysis of Group 4 Metallocene Analogs": "Análisis computacional de análogos de metaloceno del Grupo 4", "Presenting at the Summer Undergraduate Research Symposium": "Presentación en el Simposio de Investigación de Pregrado de Verano", "Click here to download the poster": "Haz clic aquí para descargar el póster", "Summer Undergraduate Research Symposium · 2026": "Simposio de Investigación de Pregrado de Verano · 2026",
  "Dashboard": "Panel", "Annual Inputs": "Entradas anuales", "Check Allocator": "Asignador de cheques", "Spending Tracker": "Registro de gastos", "Lists": "Listas",
};

type LanguageContextValue = { language: Language; t: (text: string) => string };
const LanguageContext = createContext<LanguageContextValue>({ language: "en", t: (text) => text });

export function useLanguage() { return useContext(LanguageContext); }

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("portfolio-language");
    if (saved === "es") queueMicrotask(() => setLanguage("es"));
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("portfolio-language", language);

    const reverse = Object.fromEntries(Object.entries(spanish).map(([en, es]) => [es, en]));
    const translateText = (value: string) => {
      const leading = value.match(/^\s*/)?.[0] ?? "";
      const trailing = value.match(/\s*$/)?.[0] ?? "";
      const clean = value.trim();
      if (!clean) return value;
      const translated = language === "es" ? spanish[clean] : reverse[clean];
      return translated ? `${leading}${translated}${trailing}` : value;
    };
    const translateNode = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        const next = translateText(root.textContent ?? "");
        if (next !== root.textContent) root.textContent = next;
        return;
      }
      if (!(root instanceof Element)) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current: Node | null;
      while ((current = walker.nextNode())) {
        const next = translateText(current.textContent ?? "");
        if (next !== current.textContent) current.textContent = next;
      }
      root.querySelectorAll<HTMLElement>("[aria-label], [title]").forEach((element) => {
        for (const attribute of ["aria-label", "title"] as const) {
          const value = element.getAttribute(attribute);
          if (!value) continue;
          const translated = language === "es" ? spanish[value] : reverse[value];
          if (translated) element.setAttribute(attribute, translated);
        }
      });
    };

    translateNode(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(translateNode);
        if (mutation.type === "characterData") translateNode(mutation.target);
      }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => ({ language, t: (text: string) => language === "es" ? (spanish[text] ?? text) : text }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <div className="language-switcher" role="group" aria-label={language === "es" ? "Seleccionar idioma" : "Select language"}>
        <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
        <button type="button" className={language === "es" ? "active" : ""} onClick={() => setLanguage("es")} aria-pressed={language === "es"}>ES</button>
      </div>
    </LanguageContext.Provider>
  );
}
