import type { ResumeWork } from "./resume-types";

/**
 * Per-job overrides for a given role preset.
 * Each key is the company name (matching work[].name).
 * `hidden: true` excludes the job entirely.
 * Other fields override the base resume data.
 */
export interface JobOverride {
  hidden?: boolean;
  position?: string;
  summary?: string;
  highlights?: string[];
}

export interface RoleVariant {
  id: string;
  label: string;
  description: string;
  /** Override the basics.label tagline */
  tagline?: string;
  /** Override the basics.summary expertise line */
  expertise?: string;
  tags: string[];
  jobOverrides: Record<string, JobOverride>;
  /** Project names to hide */
  hiddenProjects?: string[];
  sections: {
    work: boolean;
    projects: boolean;
    skills: boolean;
    education: boolean;
    interests: boolean;
    awards: boolean;
    references: boolean;
  };
}

const ALL_SECTIONS = {
  work: true,
  projects: true,
  skills: true,
  education: true,
  interests: true,
  awards: true,
  references: true,
};

export const ROLE_VARIANTS: RoleVariant[] = [
  {
    id: "all",
    label: "Complete Resume",
    description: "Show everything, no overrides",
    tags: [],
    jobOverrides: {},
    sections: ALL_SECTIONS,
  },
  {
    id: "agentic",
    label: "Agentic / AI Engineer",
    description: "AI systems, LLMs, automation, computer use",
    tagline: "Agentic & web engineer + open-source developer + hardware hacker",
    expertise:
      "Agentic engineer + Full-stack developer; Building AI-powered tools, autonomous agents, and intelligent automation systems",
    tags: ["Python", "Rust", "TypeScript", "Tauri", "Docker", "AWS"],
    jobOverrides: {
      "Duke Energy": {
        position: "Agentic Engineer + Senior Developer",
        summary:
          "Created internal GPT setup for company-wide AI adoption. Built agentic workflows for weather-forecasting operations. Refactored dashboard to deploy to AWS and migrated authentication to Azure A/D. Python, React, Docker, AWS, Azure",
        highlights: [
          "Designed and deployed internal LLM infrastructure for engineering teams",
          "Built automated pipelines connecting AI models to operational dashboards",
        ],
      },
      "Credit Karma": {
        summary:
          "Contract - Created the entire User Testing dashboard with automated test generation. Converted pages router to App router. Built features for creating test/production users across web and mobile. TypeScript, NextJS, React, React Native",
      },
      "Lumenai (Startup)": {
        position: "Senior Web Engineer - AI Browser Extension",
        summary:
          "Built foundational apps for an AI-powered browser extension using RPA automation. Created automated CI/CD pipelines. The company saw a 15% rise in productivity and experienced 35% growth in 6 months. React, TypeScript, Docker",
      },
      "Twilio Inc.": {
        summary:
          "In charge of twilio.com and all sub-sites. Created a React design system, built the SIGNAL HackPack v4 hardware badge with embedded software. Launched WhatsApp, Studio, Flex products. Implemented testing and automation pipelines. TypeScript, React, Docker, Python, Django",
      },
      "Appalachian State University": { hidden: true },
      "Red Ventures": { hidden: true },
      "Long Game": { hidden: true },
    },
    hiddenProjects: [
      "Boone Community Network",
      "Phase2Productions",
      "Casper",
      "XPlay.js",
      "XSPF Jukebox",
      "Cinematic",
    ],
    sections: { ...ALL_SECTIONS, interests: false },
  },
  {
    id: "frontend",
    label: "Frontend Developer",
    description: "React, Next.js, TypeScript, component systems",
    tagline: "Senior frontend engineer + open-source developer",
    expertise:
      "Frontend specialist; React/Next.js expert; Design system architect; Component library creator; Accessibility advocate",
    tags: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Vue",
      "Svelte",
      "Tailwind",
      "SASS",
    ],
    jobOverrides: {
      "Duke Energy": {
        position: "Senior Frontend Developer",
        summary:
          "Refactored a weather-forecasting dashboard with React, improving UX and performance. Migrated authentication flows to Azure A/D with seamless frontend integration. React, Docker, AWS, Azure",
      },
      "Credit Karma": {
        summary:
          "Contract - Created the entire User Testing dashboard for Credit Karma. Converted pages router to App router. Built responsive features for creating test/production users across web and mobile. Included search and metrics UIs coordinated across multiple APIs. TypeScript, NextJS, React, Tachyons, React Native",
      },
      "Novant Health / Red Ventures": {
        summary:
          "Contract - Built and maintained Physician Finder, Matcher, and landing pages. Legacy code was sunsetted and modern, accessible websites were built. TypeScript, NextJS, Vue, Datadog, Netlify",
      },
      "OptumRX Health / Red Ventures": {
        position: "Senior React Developer",
        summary:
          "Contract - Created E-commerce storefront for RVO Health. Built the product catalog, cart, and checkout UI with reusable component patterns. TypeScript, NextJS, React, Contentful, Stripe, Algolia",
      },
      "Viasat": {
        summary:
          "Contract - Built in-flight entertainment portals for dozens of airlines. Transformed polished designs into reusable component libraries. Demoed product updates to stakeholders. React, TypeScript, NextJS, Jenkins, AWS",
      },
      "Twilio Inc.": {
        position: "Senior Frontend Engineer - Brand Team",
        summary:
          "In charge of twilio.com and all sub-sites. Created a React design system used across 20+ properties. Built the SIGNAL HackPack v4 badge UI. Launched WhatsApp, Studio, Flex product pages. Localization/Regionalization across 8 languages. TypeScript, React, SASS, WordPress",
      },
      "Yahoo": {
        summary:
          "Contract - Built accessible React components for the Search and Branded Marketing teams. Focus on WCAG compliance and screen reader support. React, NodeJS, Selenium",
      },
      "Appalachian State University": { hidden: true },
      "Red Ventures": { hidden: true },
      "Long Game": { hidden: true },
      "Flymore (Startup)": { hidden: true },
    },
    hiddenProjects: [
      "Boone Community Network",
      "Phase2Productions",
      "XSPF Jukebox",
      "Cinematic",
    ],
    sections: { ...ALL_SECTIONS, interests: false, references: false },
  },
  {
    id: "fullstack",
    label: "Full Stack Engineer",
    description: "Frontend + backend + databases + DevOps",
    tagline: "Full-stack web engineer + open-source developer",
    expertise:
      "Full-stack developer; React/Next.js + Python/Node.js; Database design; API architecture; DevOps; CI/CD",
    tags: [
      "React",
      "Next.js",
      "TypeScript",
      "Node.js",
      "Python",
      "Django",
      "PostgreSQL",
      "Docker",
      "AWS",
    ],
    jobOverrides: {
      "Duke Energy": {
        position: "Senior Full Stack Developer",
        summary:
          "Refactored a weather-forecasting dashboard end-to-end: Python backend, React frontend, Docker containerization, AWS deployment. Migrated authentication to Azure A/D. Python, React, Docker, AWS, Azure, Cron",
      },
      "Swell Energy": {
        summary:
          "Contract - Developed full-stack charts, dashboards, and control panels to manage solar and power utilities. Built authentication, RESTful APIs, and CRUD operations. TypeScript, NextJS, React, Python, Django, Docker, PostgreSQL",
      },
      "Twilio Inc.": {
        summary:
          "In charge of twilio.com and all sub-sites. Created a React design system, managed CMS migrations (WordPress → Laravel/Wagtail), built API integrations, and handled on-call operations. TypeScript, React, Docker, Python, Django, Wagtail, PHP, WordPress, Laravel",
      },
      "Invitae": {
        summary:
          "Created HIPAA-compliant back office software, data science tools, and analytics platforms. Built the public-facing invitae.com. Managed database health, CI/CD pipelines, and bi-weekly deployments. Python, PHP, Laravel, MySQL, Django, Flask, React, Docker, Jenkins, AWS EC2",
      },
      "Appalachian State University": { hidden: true },
      "Red Ventures": { hidden: true },
    },
    sections: { ...ALL_SECTIONS, interests: false },
  },
  {
    id: "devops",
    label: "DevOps / Platform Engineer",
    description: "Infrastructure, CI/CD, containerization, cloud",
    tagline: "DevOps engineer + full-stack developer",
    expertise:
      "DevOps engineer; AWS/Azure cloud infrastructure; Docker containerization; CI/CD pipelines; Database management; On-call operations",
    tags: [
      "Docker",
      "AWS",
      "Azure",
      "CI/CD",
      "Jenkins",
      "Linux",
      "Vercel",
      "Netlify",
      "PostgreSQL",
    ],
    jobOverrides: {
      "Duke Energy": {
        position: "DevOps Engineer",
        summary:
          "Refactored deployment pipeline for weather-forecasting dashboard to AWS. Migrated authentication from user/password to Azure A/D (Active Directory). Containerized services with Docker. Automated scheduling with Cron. Python, React, Docker, AWS, Azure, Regex, Cron",
      },
      "Credit Karma": { hidden: true },
      "Novant Health / Red Ventures": { hidden: true },
      "OptumRX Health / Red Ventures": {
        position: "DevOps Engineer",
        summary:
          "Built automation pipelines for E-commerce platform. Managed deployment infrastructure with Vercel and Netlify. TypeScript, NextJS, Contentful, Algolia",
      },
      "Swell Energy": {
        summary:
          "Contract - Managed Docker-based infrastructure for grid services platform. Built CI/CD pipelines and managed PostgreSQL databases for solar/power utilities in California and Hawaii. Docker, PostgreSQL, Python, Django",
      },
      "Lumenai (Startup)": {
        summary:
          "Built self-hosted CI/CD pipelines and automated deployment infrastructure for browser extension platform. Docker containerization. The company saw a 15% rise in productivity and experienced 35% growth in 6 months. Docker, Jest, CI/CD",
      },
      "Twilio Inc.": {
        position: "Senior Web Engineer / DevOps - Brand Team",
        summary:
          "Managed infrastructure for twilio.com and all sub-sites. CMS migrations, emergency on-call, deployment pipelines, containerization. Docker, Python, Django, Wagtail, PHP, WordPress, Laravel, Jenkins",
      },
      "Invitae": {
        summary:
          "DevOps - Managed database health, configured CI instances, web-hooks, bi-weekly deployments. Created automated Selenium testing workflows. Docker, Jenkins, Splunk, Apache, AWS EC2, Linux, ElasticSearch",
      },
      "Yahoo": { hidden: true },
      "Long Game": { hidden: true },
      "Flymore (Startup)": { hidden: true },
      "Appalachian State University": { hidden: true },
      "Red Ventures": { hidden: true },
    },
    hiddenProjects: [
      "Casper",
      "Boone Community Network",
      "Phase2Productions",
      "XPlay.js",
      "XSPF Jukebox",
      "Cinematic",
      "NPM Libraries",
    ],
    sections: {
      ...ALL_SECTIONS,
      interests: false,
      references: false,
      awards: false,
    },
  },
  {
    id: "mobile",
    label: "Mobile Developer",
    description: "React Native, Flutter, cross-platform apps",
    tagline: "Cross-platform mobile developer + open-source contributor",
    expertise:
      "Mobile developer; React Native / Flutter expert; Cross-platform architecture; App Store deployment",
    tags: ["React Native", "Flutter", "TypeScript", "React", "Swift", "Tauri"],
    jobOverrides: {
      "Duke Energy": { hidden: true },
      "Novant Health / Red Ventures": { hidden: true },
      "Swell Energy": { hidden: true },
      "Credit Karma": {
        summary:
          "Contract - Created the User Testing dashboard with cross-platform support for web and mobile experiences. Built features for creating test/production users across React web and React Native mobile. TypeScript, NextJS, React, React Native",
      },
      "Viasat": {
        summary:
          "Contract - Managed in-flight entertainment portals optimized for tablet and mobile devices across dozens of airlines. Built responsive, touch-friendly interfaces. React, TypeScript, NextJS",
      },
      "Long Game": {
        summary:
          "Contract - Built a startup's mobile app from scratch: React web-app and React Native app for iOS and Android. Saw first launch to 100+ beta users. AWS, NodeJS, Docker, SequelizeJS, React Native",
      },
      "Yahoo": {
        summary:
          "Contract - Built React Native components and React components for the Search and Branded Marketing teams. AWS, NodeJS, Docker, SequelizeJS, React Native",
      },
      "Appalachian State University": { hidden: true },
      "Red Ventures": { hidden: true },
      "Flymore (Startup)": { hidden: true },
      "Invitae": { hidden: true },
    },
    sections: {
      ...ALL_SECTIONS,
      interests: false,
      references: false,
      awards: false,
    },
  },
];

/** Apply job overrides to a work entry, returning the modified version */
export function applyWorkOverride(
  entry: ResumeWork,
  variant: RoleVariant,
): (ResumeWork & { hidden: boolean }) {
  const override = variant.jobOverrides[entry.name];
  if (!override) return { ...entry, hidden: false };
  return {
    ...entry,
    position: override.position ?? entry.position,
    summary: override.summary ?? entry.summary,
    highlights: override.highlights ?? entry.highlights,
    hidden: override.hidden ?? false,
  };
}

/** Check if a project should be hidden for this variant */
export function isProjectHidden(
  projectName: string,
  variant: RoleVariant,
): boolean {
  return variant.hiddenProjects?.includes(projectName) ?? false;
}
