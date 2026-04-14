import type { SectionKey } from "./resume-types";

/**
 * A flavor is a complete resume variant for a target role.
 * It overrides titles, descriptions, and visibility per entry.
 * The base resume.json is the "complete" truth; flavors are overlays.
 */

export interface WorkOverride {
  visible?: boolean;       // false to hide this entry entirely
  position?: string;       // override job title
  summary?: string;        // override description
  highlights?: string[];   // override bullet points
}

export interface ProjectOverride {
  visible?: boolean;
  summary?: string;
}

export interface ResumeFlavor {
  id: string;
  label: string;
  description: string;
  tagline: string;         // overrides basics.label
  expertise: string;       // overrides the expertise line in summary
  sections: Record<SectionKey, boolean>;
  work: Record<string, WorkOverride>;       // keyed by company name
  projects: Record<string, ProjectOverride>; // keyed by project name
}

// ─── Flavor Definitions ────────────────────────────────────────────────────

const ALL_SECTIONS: Record<SectionKey, boolean> = {
  work: true, projects: true, skills: true, education: true,
  interests: true, awards: true, references: true,
};

export const FLAVORS: ResumeFlavor[] = [
  {
    id: "complete",
    label: "Complete Resume",
    description: "Everything, unfiltered",
    tagline: "Agentic & web engineer + open-source developer + hardware hacker",
    expertise: "Agentic engineer + Full-stack developer + Hardware Engineer; Agency owner; Tech/Development lead; Product/Project manager; DevOps; IT consultant; Software architect; Hiring manager; SCRUM master",
    sections: ALL_SECTIONS,
    work: {},
    projects: {},
  },

  {
    id: "frontend",
    label: "Frontend Engineer",
    description: "React, Next.js, TypeScript, UI/UX",
    tagline: "Frontend engineer + open-source developer",
    expertise: "Frontend specialist; React/Next.js expert; TypeScript; UI/UX development; Design systems; Accessibility; Performance optimization",
    sections: { ...ALL_SECTIONS, interests: false, awards: false, references: false },
    work: {
      "Duke Energy": {
        position: "Senior Frontend Developer",
        summary: "Built React dashboards for weather forecasting. Migrated authentication UI to Azure AD. Python, React, Docker, AWS, Azure.",
      },
      "Credit Karma": {
        summary: "Created the entire User Testing dashboard for Credit Karma. Converted pages router to App router. Built features for creating test/production users across web and mobile. Included search and metrics UI coordinated across multiple system APIs. TypeScript, NextJS, React, Tachyons, React Native",
      },
      "Novant Health / Red Ventures": {},
      "OptumRX Health / Red Ventures": {
        position: "Senior Frontend Developer",
        summary: "Built E-commerce frontend for RVO Health. Created the market UI, inventory displays, and ordering flows with polished component architecture. TypeScript, NextJS, React, Contentful, Stripe, Algolia",
      },
      "Swell Energy": {
        position: "Senior Frontend Developer - Grid Services",
        summary: "Developed interactive charts, dashboards, and control panel UIs to manage solar and power utilities. Authentication flows, data visualization, responsive CRUD interfaces. TypeScript, NextJS, React.",
      },
      "Viasat": {},
      "Twilio Inc.": {
        summary: "In charge of twilio.com and all sub-sites. Created a React design system used across the organization. Managed and lead multiple frontend projects. Built the SIGNAL HackPack v4 badge. Launched WhatsApp, Studio, Flex product pages. Led localization/regionalization frontend effort. TypeScript, React, i18n.",
      },
      "Yahoo": {},
      "Invitae": {
        summary: "UX/UI Developer - Developed navigation, modals, and interactions for HIPAA-compliant healthcare platform. Made custom WordPress theme. Built data science visualization tools. React, Angular, Backbone, WordPress, SASS.",
      },
      "10up": {},
      "LacyMorrow.com": { visible: false },
      "Lumenai (Startup)": {},
      "TekSystems": { visible: false },
      "Flymore (Startup)": { visible: false },
      "Long Game": { visible: false },
      "Appalachian State University": { visible: false },
      "Red Ventures": { visible: false },
    },
    projects: {
      "Shipkit": {},
      "Uibrary": {},
      "CrossOver": {},
      "Lacy Shell": {},
      "React Component Libraries": {},
      "Juno AI": { visible: false },
      "Vibe Rehab": { visible: false },
      "Hitchhiker's Guide to the Galaxy": { visible: false },
      "OpenClaw Alpaca": { visible: false },
      "Twilio Hackpack v4": { visible: false },
      "Boone Community Network": { visible: false },
      "Phase2Productions": { visible: false },
      "XPlay.js": { visible: false },
      "XSPF Jukebox": { visible: false },
      "Cinematic": { visible: false },
      "Casper": { visible: false },
      "NPM Libraries": {},
    },
  },

  {
    id: "fullstack",
    label: "Full Stack Engineer",
    description: "Frontend + Backend + APIs + Database",
    tagline: "Full-stack web engineer + open-source developer",
    expertise: "Full-stack developer; React/Next.js + Node/Python/PHP; API design; Database architecture; DevOps; Software architect; Tech lead",
    sections: { ...ALL_SECTIONS, interests: false },
    work: {
      "Duke Energy": {
        position: "Senior Full-Stack Developer",
        summary: "Refactored a weather-forecasting dashboard end-to-end: React frontend, Python backend, deployed to AWS. Migrated authentication to Azure AD. Python, React, Docker, AWS, Azure.",
      },
      "Credit Karma": {},
      "Novant Health / Red Ventures": {},
      "OptumRX Health / Red Ventures": {
        summary: "Created full-stack E-commerce platform for RVO Health. Built the market, inventory, authentication, and ordering systems with automation pipelines. TypeScript, NextJS, React, Contentful, Plytix, Stripe, Algolia",
      },
      "Swell Energy": {},
      "Viasat": {},
      "Twilio Inc.": {},
      "Yahoo": {},
      "Invitae": {},
      "10up": {},
      "LacyMorrow.com": { visible: false },
      "Lumenai (Startup)": {},
      "TekSystems": {},
      "Flymore (Startup)": { visible: false },
      "Long Game": {},
      "Appalachian State University": {},
      "Red Ventures": { visible: false },
    },
    projects: {},
  },

  {
    id: "devops",
    label: "DevOps Engineer",
    description: "Infrastructure, CI/CD, Cloud, Docker",
    tagline: "DevOps engineer + infrastructure specialist",
    expertise: "DevOps; AWS/Azure/GCP; Docker; CI/CD pipelines; Infrastructure automation; Linux systems; Monitoring; Database administration",
    sections: { ...ALL_SECTIONS, interests: false, references: false, awards: false },
    work: {
      "Duke Energy": {
        position: "DevOps Engineer",
        summary: "Refactored weather-forecasting dashboard deployment to AWS. Migrated authentication infrastructure to Azure AD from user/password. Configured containerized deployments and cron-based automation. Python, Docker, AWS, Azure, Regex, Cron.",
      },
      "Credit Karma": { visible: false },
      "Novant Health / Red Ventures": { visible: false },
      "OptumRX Health / Red Ventures": {
        position: "DevOps Engineer",
        summary: "Built automation pipelines for E-commerce platform. Configured CI/CD, deployment workflows, and infrastructure for production systems. TypeScript, NextJS, Contentful, Algolia.",
      },
      "Swell Energy": {
        summary: "Managed infrastructure for solar grid management platform. Docker containerization, PostgreSQL database administration, Django backend deployment. TypeScript, NextJS, React, Python, Django, Docker, PostgreSQL.",
      },
      "Viasat": {
        summary: "Managed deployment and on-call for in-flight entertainment portals serving dozens of airlines. Jenkins CI/CD, AWS infrastructure, MySQL database management. React, TypeScript, Jenkins, AWS, MySQL.",
      },
      "Twilio Inc.": {
        position: "Senior Web Engineer - DevOps & Brand Team",
        summary: "Managed infrastructure for twilio.com and all sub-sites. Implemented testing pipelines, migrated blog and legal sites to Laravel CMS. Worked emergency on-call. Docker deployments, WordPress and Django infrastructure. TypeScript, Docker, Python, Django, Wagtail, PHP, WordPress, Laravel.",
      },
      "Yahoo": { visible: false },
      "Invitae": {
        position: "DevOps Engineer",
        summary: "Managed database health, configured continuous integration instances, web-hooks, bi-weekly deployments. Created an automated Selenium testing workflow. Docker, Jenkins, Splunk, Apache, AWS EC2, Linux, ElasticSearch.",
      },
      "10up": {
        summary: "Managed deployment pipelines and infrastructure for client websites including Microsoft, Uber, AARP. Docker, WordPress hosting, AWS, Webpack build systems.",
      },
      "LacyMorrow.com": { visible: false },
      "Lumenai (Startup)": {
        summary: "Built CI/CD pipeline from scratch. Automated deployments with Docker and Jest testing. The company saw a 15% rise in productivity and experienced 35% growth in 6 months.",
      },
      "TekSystems": { visible: false },
      "Flymore (Startup)": { visible: false },
      "Long Game": { visible: false },
      "Appalachian State University": {
        position: "DevOps / Web Developer",
        summary: "Managed database and handled deployments for campus web infrastructure. Created custom CMS framework used by all campus web pages. PHP, Python, Postgres, MySQL, Git, Apache, Linux.",
      },
      "Red Ventures": { visible: false },
    },
    projects: {
      "Juno AI": { visible: false },
      "Shipkit": { visible: false },
      "Uibrary": { visible: false },
      "CrossOver": { visible: false },
      "Casper": { visible: false },
      "NPM Libraries": { visible: false },
      "React Component Libraries": { visible: false },
      "Cinematic": { visible: false },
      "Boone Community Network": { visible: false },
      "Phase2Productions": { visible: false },
    },
    projects: {},
  },

  {
    id: "ai",
    label: "AI / Agentic Engineer",
    description: "AI agents, LLMs, automation, Rust/Tauri",
    tagline: "Agentic engineer + AI systems builder + hardware hacker",
    expertise: "Agentic engineer; AI/LLM integration; Automation & RPA; Rust/Tauri desktop apps; Full-stack developer; Open-source maintainer",
    sections: ALL_SECTIONS,
    work: {
      "Duke Energy": {
        position: "Agentic Engineer",
        summary: "Created internal GPT setup for company-wide AI adoption. Built agentic workflows for internal tooling. Also refactored weather-forecasting dashboard to deploy to AWS. Python, React, Docker, AWS, Azure.",
      },
      "Credit Karma": {
        summary: "Built automated User Testing dashboard with features for creating test/production users programmatically across web and mobile. Coordinated search and metrics across multiple system APIs. TypeScript, NextJS, React, React Native.",
      },
      "Novant Health / Red Ventures": { visible: false },
      "OptumRX Health / Red Ventures": { visible: false },
      "Swell Energy": { visible: false },
      "Viasat": { visible: false },
      "Twilio Inc.": {
        summary: "In charge of twilio.com and all sub-sites. Built the SIGNAL HackPack v4 badge (open-source hardware). Created a React design system. Managed multiple engineering projects. TypeScript, React, Docker, Python, Django.",
      },
      "Yahoo": { visible: false },
      "Invitae": {
        summary: "Created data science tools and analytics software for HIPAA-compliant healthcare platform. Built automated Selenium testing workflows. Python, Django, Flask, React, ElasticSearch, Docker.",
      },
      "10up": { visible: false },
      "LacyMorrow.com": { visible: false },
      "Lumenai (Startup)": {
        summary: "Built RPA automation browser extension. Created foundational internal apps with automated deployments and self-built CI/CD. The company saw a 15% rise in productivity and experienced 35% growth in 6 months. React, Docker, Jest.",
      },
      "TekSystems": { visible: false },
      "Flymore (Startup)": {
        summary: "Developed software to livestream 4 analog FPV drone feeds simultaneously. Co-founded drone education startup teaching kids software & electronics. ReactJS, GraphQL.",
      },
      "Long Game": { visible: false },
      "Appalachian State University": { visible: false },
      "Red Ventures": { visible: false },
    },
    projects: {
      "Lacy Shell": {},
      "Juno AI": {},
      "Vibe Rehab": {},
      "OpenClaw Alpaca": {},
      "Shipkit": {},
      "Hitchhiker's Guide to the Galaxy": {},
      "Twilio Hackpack v4": {},
      "Uibrary": { visible: false },
      "CrossOver": { visible: false },
      "Casper": { visible: false },
      "Boone Community Network": { visible: false },
      "Phase2Productions": { visible: false },
      "XPlay.js": { visible: false },
      "XSPF Jukebox": { visible: false },
      "Cinematic": { visible: false },
    },
  },

  {
    id: "lead",
    label: "Engineering Lead / Manager",
    description: "Team leadership, project management, architecture",
    tagline: "Engineering leader + technical architect + team builder",
    expertise: "Tech/Development lead; Product/Project manager; Software architect; Hiring manager; SCRUM master; Stakeholder management; Agency owner",
    sections: ALL_SECTIONS,
    work: {
      "Duke Energy": {
        position: "Senior Developer & Technical Lead",
        summary: "Led AI initiative creating internal GPT setup for company-wide adoption. Directed refactoring of weather-forecasting dashboard for AWS migration. Managed authentication migration to Azure AD. Python, React, Docker, AWS, Azure.",
      },
      "Credit Karma": {
        position: "Technical Lead - User Management",
        summary: "Led development of the entire User Testing dashboard for the User Management team. Drove architecture decisions for pages router to App router migration. Coordinated features across multiple system APIs. TypeScript, NextJS, React.",
      },
      "Novant Health / Red Ventures": {},
      "OptumRX Health / Red Ventures": {
        position: "Senior Developer & DevOps Lead",
        summary: "Led development of E-commerce platform for RVO Health. Architected market, inventory, authentication, and ordering systems. Managed automation pipeline strategy. TypeScript, NextJS, React, Contentful, Stripe, Algolia.",
      },
      "Swell Energy": {
        position: "Lead Web Developer - Grid Services",
      },
      "Viasat": {
        summary: "In charge of workflow management and client-stakeholder relations for in-flight entertainment portals serving dozens of airlines. Demoed product updates to stakeholders. Managed on-call rotation. Transformed designs into reusable component architecture. React, TypeScript, NextJS, Jenkins, AWS, MySQL.",
      },
      "Twilio Inc.": {
        position: "Senior Web Engineer & Tech Lead - Brand Team",
        summary: "Led twilio.com and all sub-sites. Managed and led multiple cross-functional projects. Created a React design system adopted org-wide. Built the SIGNAL HackPack v4 badge. Launched WhatsApp, Studio, Flex product pages. Led localization/regionalization initiative. Worked emergency on-call. TypeScript, React, Docker, Python, Django.",
      },
      "Yahoo": { visible: false },
      "Invitae": {
        summary: "Full-Stack Web Developer and Tech Interviewer. Created HIPAA-compliant back office software. Led UX/UI development. Managed database health and CI/CD pipelines. Conducted technical interviews for engineering hires.",
      },
      "10up": {},
      "LacyMorrow.com": { visible: false },
      "Lumenai (Startup)": {},
      "TekSystems": { visible: false },
      "Flymore (Startup)": {
        position: "Co-Founder / Director of Engineering",
      },
      "Long Game": { visible: false },
      "Appalachian State University": { visible: false },
      "Red Ventures": { visible: false },
    },
    projects: {},
  },
];
