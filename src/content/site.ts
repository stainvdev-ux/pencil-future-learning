// Website copy, taken from "Pencil Complete Website Copy" (editorial master copy, October 2026).
// Everything described as proposed or planned stays worded that way.

export const PROGRAM_NOTE =
  "Program availability, entry criteria, duration and certification details will be confirmed before enrollment.";

export const home = {
  intro:
    "A new destination for industry-connected education, emerging technologies and practical learning. Pencil Future Learning City is designed to help ambitious learners build the skills and confidence to navigate a changing world.",
  statement: "Education should be experienced, not simply studied.",
  statementBody:
    "At Pencil, we envision a multidisciplinary learning environment where technical knowledge, technology and professional capability meet.",
  highlights: [
    "Five interdisciplinary schools",
    "Planned experiential learning centre",
    "Career-focused learning",
    "Industry engagement",
  ],
  closing: ["Learn.", "Experience.", "Evolve."],
  closingLine: "Your future starts with a Pencil.",
};

export const about = {
  headline: "A Different Way to Learn.",
  intro:
    "Pencil Future Learning City is an emerging multidisciplinary learning destination in Calicut, Kerala, created around a simple idea: the strongest learning connects theory with experience.",
  approach: ["Explore the fundamentals.", "Apply the concepts.", "Develop the confidence", "to move forward."],
};

export const schoolsIntro = {
  headline: "Many Disciplines. One Future.",
  body: "Pencil is structured around five proposed schools that connect contemporary learning pathways with practical and professional application.",
};

export type School = {
  id: "engineering" | "construction" | "ai" | "business" | "professional";
  name: string;
  intro: string;
  programs: string[];
};

export const schools: School[] = [
  {
    id: "engineering",
    name: "Engineering & Industrial Technology",
    intro: "Build understanding of the systems, equipment and standards that support modern industrial operations.",
    programs: [
      "Oil & Gas Engineering",
      "Piping & Pipeline Engineering",
      "QA/QC Mechanical",
      "QA/QC Civil",
      "Non-Destructive Testing (NDT)",
      "Industrial Maintenance",
    ],
  },
  {
    id: "construction",
    name: "Construction & Built Environment",
    intro: "Explore the tools and methods shaping the built environment.",
    programs: [
      "Building Information Modeling (BIM) & MEP",
      "Construction Management",
      "Quantity Surveying",
      "Construction Project Controls",
    ],
  },
  {
    id: "ai",
    name: "AI & Digital Technologies",
    intro: "Develop skills for a technology-driven world.",
    programs: [
      "Artificial Intelligence & Data Science",
      "Robotics & Automation",
      "Cybersecurity",
      "Python with AI/ML",
      "Digital Marketing with AI",
    ],
  },
  {
    id: "business",
    name: "Business & Management",
    intro: "Understand the systems and decisions behind effective organizations.",
    programs: [
      "Logistics & Supply Chain Management",
      "Hospital Administration",
      "Business Operations",
      "Professional Management",
    ],
  },
  {
    id: "professional",
    name: "Professional Development",
    intro: "Strengthen the capabilities that support career growth and organizational performance.",
    programs: [
      "Leadership",
      "Professional Communication",
      "Employability Skills",
      "Corporate Training",
      "Professional Certification Preparation",
    ],
  },
];

export const experience = {
  headline: "Beyond the Classroom.",
  intro:
    "Pencil proposes a miniature industrial learning facility where learners can examine equipment and explore engineering concepts in context.",
  elements:
    "One process column, one vessel, one storage tank, two heat exchangers, one reactor and a flare demonstration concept, with supporting piping and instrumentation.",
  themes: [
    "Equipment familiarization",
    "Process-flow interpretation",
    "Mechanical systems",
    "Inspection fundamentals",
    "Maintenance concepts",
    "Safe industrial practices",
  ],
  note: "Facility scope and activities will be finalized through engineering design, safety review and commissioning.",
};

export const industry = {
  headline: "Knowledge Meets Industry.",
  intro:
    "Our ambition is to build a meaningful exchange between learners, educators and industry professionals through practical insight and collaborative experiences.",
  activities: [
    "Guest lectures",
    "Case studies",
    "Technical masterclasses",
    "Equipment demonstrations",
    "Applied projects",
    "Curriculum advisory sessions",
  ],
  note: "We do not claim formal institutional affiliation, accreditation or employer placement agreements without verification.",
};

export const careers = {
  headline: "Skills for What Comes Next.",
  intro:
    "Professional growth calls for more than technical knowledge. Pencil aims to support career readiness through communication, portfolio building and informed career exploration.",
  services: [
    "Career guidance",
    "CV and interview workshops",
    "Professional communication",
    "Technical assessments",
    "Project portfolios",
    "Employer interaction opportunities",
  ],
  note: "Career outcomes depend on individual performance and market conditions. No guaranteed employment or salary claims are made.",
};

export const campus = {
  headline: "A Place to Explore.",
  intro:
    "Pencil is envisioned as a contemporary learning environment in Calicut, designed for collaborative study, technical exploration and interdisciplinary discovery.",
  spaces:
    "Planned spaces may include modern classrooms, digital learning environments, technical labs, collaborative areas and the miniature industrial learning facility.",
};

export const admissions = {
  headline: "Your Next Chapter Starts Here.",
  intro:
    "Whether you are a student exploring a direction, a graduate building employable skills or a professional developing new capabilities, Pencil aims to offer pathways suited to your goals.",
  steps: [
    "Explore a program.",
    "Request the latest program guide.",
    "Review eligibility, fees and schedule.",
    "Submit an application.",
    "Receive enrollment confirmation.",
  ],
  faq: [
    { q: "Who can apply?", a: "Eligibility varies by program." },
    {
      q: "Are certificates provided?",
      a: "The issuing organization and assessment criteria will be specified for each confirmed program.",
    },
    { q: "Is placement guaranteed?", a: "No." },
  ],
  cta: "Speak to Admissions",
};

export const contact = {
  headline: "Start a Conversation.",
  place: "Pencil Future Learning City | Calicut, Kerala, India.",
  body: "For program enquiries, collaborations or institutional information, contact our team using the official channels once published.",
};

export const nav = [
  { href: "/about", label: "About" },
  { href: "/schools", label: "Schools" },
  { href: "/programs", label: "Programs" },
  { href: "/campus", label: "Campus" },
  { href: "/admissions", label: "Admissions" },
];
