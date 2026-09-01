import { resumeJson } from "../inputs";
import type { ResumeSchema } from "./types";

export const resumeData: ResumeSchema = resumeJson as unknown as ResumeSchema;
