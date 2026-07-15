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
    expertise: "Agentic engineer + Full-stack developer + GTM/Growth engineer + Hardware Engineer; AI/GenAI integration (LLMs, LangChain, LangGraph, RAG, MCP); GTM engineering (product launches, e-commerce funnels, SEO/analytics, marketing automation); Agency owner; Tech/Development lead; Product/Project manager; DevOps; IT consultant; Software architect; Hiring manager; SCRUM master",
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
      "American City Business Journals": { visible: false },
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
      "OpenClaw Trading Skills": { visible: false },
      "MCP Servers & Tools": { visible: false },
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
      "American City Business Journals": {
        position: "Senior Full-Stack Developer",
        summary: "Contract - Built and migrated a backend Laravel platform powering business publications across 48 U.S. markets. Architected an AI orchestration layer for autonomous engineering task completion. Laravel, PHP, AI/LLM Orchestration, Claude.",
      },
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
      "American City Business Journals": { visible: false },
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
      "OpenClaw Trading Skills": { visible: false },
      "MCP Servers & Tools": { visible: false },
      "Casper": { visible: false },
      "NPM Libraries": { visible: false },
      "React Component Libraries": { visible: false },
      "Cinematic": { visible: false },
      "Boone Community Network": { visible: false },
      "Phase2Productions": { visible: false },
    },
  },

  {
    id: "ai",
    label: "AI / Agentic Engineer",
    description: "AI agents, LLMs, RAG, LangChain/LangGraph, automation",
    tagline: "Agentic engineer + AI systems builder + hardware hacker",
    expertise: "Agentic engineer; LLM & GenAI integration; LangChain / LangGraph / LlamaIndex; RAG pipelines; Agent orchestration & MCP; Vector databases; Automation & RPA; Full-stack developer (Node.js, TypeScript, React); Open-source maintainer",
    sections: ALL_SECTIONS,
    work: {
      "American City Business Journals": {
        position: "Agentic Engineer",
        summary: "Contract - Architected an AI orchestration layer managing 12 autonomous agents that independently completed engineering tasks across a 48-market business publication platform — agent-based workflows with task routing, guardrails, and human-in-the-loop review. Built RAG (Retrieval-Augmented Generation) pipelines grounding agents in platform documentation and code. Developed Claude agent personas and reusable skill sets for the development team. Laravel, PHP, AI/LLM Orchestration, Claude, Autonomous Agents, LangGraph, RAG, MCP.",
      },
      "Duke Energy": {
        position: "Agentic Engineer",
        summary: "Led internal AI adoption: built an internal GPT/LLM platform for company-wide use with RAG (Retrieval-Augmented Generation) over internal documentation, prompt libraries, and Azure OpenAI integration. Built agentic workflows for internal tooling. Python, React, LangChain, LlamaIndex, RAG, LLMs, Azure, AWS.",
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
      "OpenClaw Trading Skills": {},
      "MCP Servers & Tools": {},
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
    id: "gtm",
    label: "GTM Engineer",
    description: "Go-to-market: launches, growth, funnels, marketing automation",
    tagline: "GTM engineer + full-stack product launcher",
    expertise: "GTM/Growth engineering; Product launches & marketing sites; Landing pages & e-commerce funnels (Stripe, Algolia, Contentful); SEO / Analytics / Google Tag Manager; Localization & i18n; AI-powered GTM automation (agents, RPA); Full-stack developer (TypeScript, React, Next.js)",
    sections: { ...ALL_SECTIONS, interests: false },
    work: {
      "American City Business Journals": {
        position: "Automation & Platform Engineer",
        summary: "Contract - Built and migrated the Laravel platform powering business publications across 48 U.S. markets. Architected an AI orchestration layer of 12 autonomous agents that independently completed engineering tasks — the agent-based automation (task routing, guardrails, human-in-the-loop review) now central to modern GTM workflows. Laravel, PHP, Claude, AI Agents, Automation.",
      },
      "Duke Energy": {
        position: "AI Platform Engineer - Internal Adoption",
        summary: "Drove company-wide adoption of an internal GPT/LLM platform: built the product, onboarding, and prompt libraries that turned an internal tool into an org-wide rollout. RAG over internal documentation, Azure OpenAI integration. Python, React, LangChain, RAG, Azure.",
      },
      "Credit Karma": {
        summary: "Built the User Testing dashboard powering user research at Credit Karma — programmatic creation of test/production users across web and mobile, with search and metrics coordinated across multiple system APIs. TypeScript, NextJS, React.",
      },
      "Novant Health / Red Ventures": {
        summary: "Contract - Built and maintained Physician Finder, Matcher, and landing pages for Novant Health patient acquisition. Sunsetted legacy code and rebuilt modern sites with TypeScript, NextJS, and Vue, instrumented with Datadog and deployed on Netlify.",
      },
      "OptumRX Health / Red Ventures": {
        position: "E-commerce Engineer",
        summary: "Contract - Created the E-commerce storefront for RVO Health: market pages, inventory, authentication, and ordering funnels with Stripe payments, Algolia search, and Contentful content ops, complete with automation pipelines. TypeScript, NextJS, React, Plytix.",
      },
      "Swell Energy": { visible: false },
      "Viasat": { visible: false },
      "Twilio Inc.": {
        position: "Senior Web Engineer - Brand & Web Team",
        summary: "Owned twilio.com and all sub-sites — the company's primary marketing and acquisition surface. Launched product pages for the WhatsApp, Studio, and Flex releases. Created a React design system adopted org-wide. Led the localization/regionalization effort for international markets. Migrated blog and legal sites to a CMS for content velocity. TypeScript, React, i18n, WordPress, Wagtail.",
      },
      "Yahoo": {
        summary: "Contract - Built React components for the Search and Branded Marketing teams on a Yahoo stack, using Tumblr as a data-serve API. NodeJS, ReactJS, Electron.",
      },
      "Invitae": {
        summary: "Built the public-facing invitae.com and a custom WordPress theme; led UX/UI development for a HIPAA-compliant healthcare platform. React, WordPress, SASS.",
      },
      "10up": {},
      "LacyMorrow.com": { visible: false },
      "Lumenai (Startup)": {
        summary: "Built RPA and LLM-assisted automation via a browser extension, plus foundational internal apps with automated deployments. The company saw a 15% rise in productivity and 35% growth in 6 months. React, TypeScript, Docker, Jest.",
      },
      "TekSystems": { visible: false },
      "Flymore (Startup)": {
        summary: "Co-founded a drone-education startup: created the Flymore LLC web identity and Academy website, hosted Charlotte's first drone race (a Drone Nationals qualifier), and ran camps teaching kids software & electronics. ReactJS, GraphQL, WordPress.",
      },
      "Long Game": {
        summary: "Contract - Helped take a startup from zero to first launch: built the initial React web app and second-iteration React Native app for iOS and Android, launched to 100+ beta users. AWS, NodeJS, React Native.",
      },
      "Appalachian State University": { visible: false },
      "Red Ventures": { visible: false },
    },
    projects: {
      "Shipkit": {
        summary: "Next.js Accelerator for building, launching, and monetizing MVPs — the full GTM stack (auth, payments, CMS, analytics, email) preconfigured so products ship in days, not months.",
      },
      "Vibe Rehab": {},
      "CrossOver": {
        summary: "Electron cross-platform crosshair overlay for PC gaming. Launched and distributed through the Windows App Store and Snapcraft store.",
      },
      "NPM Libraries": {},
      "Twilio Hackpack v4": {
        summary: "Twilio's open-source hardware badge built for the SIGNAL 2018 conference — developer-marketing hardware with a joystick, lights, 7 buttons, and a touchscreen on a Raspberry Pi Zero.",
      },
      "Lacy Shell": { visible: false },
      "Juno AI": { visible: false },
      "Hitchhiker's Guide to the Galaxy": { visible: false },
      "OpenClaw Trading Skills": { visible: false },
      "MCP Servers & Tools": { visible: false },
      "Uibrary": { visible: false },
      "React Component Libraries": { visible: false },
      "Cinematic": { visible: false },
      "Casper": { visible: false },
      "Boone Community Network": { visible: false },
      "Phase2Productions": { visible: false },
      "XPlay.js": { visible: false },
      "XSPF Jukebox": { visible: false },
    },
  },

  {
    id: "lead",
    label: "Engineering Lead / Manager",
    description: "Team leadership, project management, architecture",
    tagline: "Engineering leader + technical architect + team builder",
    expertise: "Tech/Development lead; Product/Project manager; Software architect; AI/GenAI delivery (LLMs, RAG, agent orchestration); Hiring manager; SCRUM master; Stakeholder management; Agency owner",
    sections: ALL_SECTIONS,
    work: {
      "American City Business Journals": {
        position: "Technical Lead + Agentic Engineer",
        summary: "Contract - Led development and migration of a backend Laravel platform serving 48 U.S. markets. Architected and managed an AI orchestration layer with 12 autonomous engineering agents — agent-based workflows with task routing, guardrails, and human-in-the-loop review, grounded by RAG pipelines. Developed Claude agent personas and skill sets adopted across the development team. Laravel, PHP, AI/LLM Orchestration, Claude, LangGraph, RAG.",
      },
      "Duke Energy": {
        position: "Senior Developer & Technical Lead",
        summary: "Led AI initiative creating an internal GPT/LLM platform for company-wide adoption, with RAG over internal documentation and Azure OpenAI integration. Directed refactoring of weather-forecasting dashboard for AWS migration. Managed authentication migration to Azure AD. Python, React, LangChain, RAG, Docker, AWS, Azure.",
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
