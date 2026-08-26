export interface ResumeSchema {
  basics: ResumeBasics;
  work: ResumeWork[];
  volunteer: ResumeVolunteer[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  awards: ResumeAward[];
  certificates: ResumeCertificate[];
  publications: ResumePublication[];
  skills: ResumeSkill[];
  languages: ResumeLanguage[];
  interests: ResumeInterest[];
  references: ResumeReference[];
}

export interface ResumeBasics {
  name: string;
  label: string;
  image: string;
  email: string;
  phone: string;
  url: string;
  summary: string;
  location: {
    countryCode: string;
    city: string;
    state: string;
    address: string;
  };
  profiles: {
    network: string;
    username: string;
    url: string;
  }[];
}

export interface ResumeWork {
  name: string;
  position: string;
  startDate: string;
  endDate?: string;
  summary: string;
  url?: string;
  location?: string;
  highlights?: string[];
  sector?: string;
  /**
   * The tech stack, rendered as a bold trailing line. Explicit rather than
   * detected: the renderers used to guess which sentence was a tech list, and
   * the guess disagreed with itself over trailing periods and semicolons.
   */
  tech?: string[];
}

export interface ResumeProject {
  name: string;
  startDate: string;
  endDate?: string;
  summary: string;
  url?: string;
  highlights?: string[];
  /** Flagship projects get a ★ in exports, like the handmade resume */
  featured?: boolean;
  /** See ResumeWork.tech. */
  tech?: string[];
}

export interface ResumeEducation {
  institution: string;
  area: string;
  studyType: string;
  startDate: string;
  endDate: string;
  score: string;
  courses: string[];
}

export interface ResumeSkill {
  name: string;
  level: string;
  keywords: string[];
}

export interface ResumeInterest {
  name: string;
  keywords?: string[];
}

export interface ResumeVolunteer {
  organization: string;
  position: string;
  startDate: string;
  endDate?: string;
  summary?: string;
  url?: string;
  highlights?: string[];
}

export interface ResumeCertificate {
  name: string;
  date?: string;
  issuer?: string;
  url?: string;
}

export interface ResumePublication {
  name: string;
  publisher?: string;
  releaseDate?: string;
  summary?: string;
  url?: string;
}
export interface ResumeAward {
  title: string;
  awarder: string;
  date: string;
}
export interface ResumeReference {
  reference: string;
  name: string;
}
export interface ResumeLanguage {
  language: string;
  fluency: string;
}

/**
 * Section keys are declared by the section registry (see ./sections.ts), not
 * fixed here — a resume can define whatever sections it wants. Kept as a named
 * alias so call sites still read as "this string is a section key".
 */
export type SectionKey = string;

/** Visibility map keyed by section. A missing key falls back to the registry default. */
export type SectionVisibility = Record<SectionKey, boolean>;
