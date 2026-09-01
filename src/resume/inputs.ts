/**
 * The only file in the engine that reaches outside itself.
 *
 * Everything under src/resume/ imports its data and settings from here, so
 * pointing the engine at a different resume — or lifting it into a package that
 * takes them as arguments — means changing this file and nothing else.
 */

export { FLAVOR_FILES } from "../../flavors";
export type {
  PageGeometry,
  PrintTheme,
  ResumeConfig,
  ScreenTheme,
  SummaryBlock,
} from "../../resume.config";
export { resumeConfig } from "../../resume.config";
export { default as resumeJson } from "../../resume.json";
