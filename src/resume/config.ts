/**
 * Everything about *this* resume that is not resume data itself.
 *
 * Anything a different person would need to change to run their own copy
 * belongs here rather than inline in a component or exporter. This file grows
 * as the remaining hardcoded values are pulled out of the engine.
 */
export interface ResumeSiteConfig {
  /** Shown in the on-screen footer beside the name. */
  host: string;
}

export interface ResumeConfig {
  site: ResumeSiteConfig;
}

export const resumeConfig: ResumeConfig = {
  site: {
    host: "resume.lacy.sh",
  },
};
