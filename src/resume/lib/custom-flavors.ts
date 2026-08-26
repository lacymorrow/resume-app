"use client";

import type { FilterState } from "./filters";
import type { FlavorFile, ResumeFlavor } from "./flavors";
import { defaultSectionVisibility } from "./sections";

const STORAGE_KEY = "resume-custom-flavors";

export interface CustomFlavor extends ResumeFlavor {
  isCustom: true;
  hiddenCompanies: string[];
  hiddenProjects: string[];
  createdAt: number;
}

export function loadCustomFlavors(): CustomFlavor[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomFlavor[]) : [];
  } catch {
    // Private windows and blocked site data both throw here; a missing list is
    // the correct answer either way.
    return [];
  }
}

export function saveCustomFlavor(flavor: CustomFlavor): void {
  try {
    const existing = loadCustomFlavors().filter((f) => f.id !== flavor.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, flavor]));
  } catch {
    // Nothing to do — the flavor can still be downloaded as JSON.
  }
}

export function deleteCustomFlavor(id: string): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(loadCustomFlavors().filter((f) => f.id !== id))
    );
  } catch {
    // See saveCustomFlavor.
  }
}

/** Snapshot the current filter state as a custom flavor. */
export function filterStateToCustomFlavor(
  filters: FilterState,
  name: string,
  baseFlavor: ResumeFlavor,
  timestamp: number = Date.now()
): CustomFlavor {
  return {
    ...baseFlavor,
    id: `custom-${timestamp}`,
    label: name,
    description: "Custom flavor",
    sections: filters.sections,
    work: {
      ...baseFlavor.work,
      ...Object.fromEntries(filters.hiddenCompanies.map((c) => [c, { visible: false }])),
    },
    projects: {
      ...baseFlavor.projects,
      ...Object.fromEntries(filters.hiddenProjects.map((p) => [p, { visible: false }])),
    },
    isCustom: true,
    hiddenCompanies: filters.hiddenCompanies,
    hiddenProjects: filters.hiddenProjects,
    createdAt: timestamp,
  };
}

/**
 * Convert a flavor to the on-disk /flavors/*.json shape.
 *
 * This is the bridge between building a variant in the browser and committing
 * it to a repo: tune it with the panel, download the file, drop it in /flavors,
 * add it to the index. Only section keys that differ from the registry defaults
 * are written, and empty overrides are dropped, so the file stays readable.
 */
export function flavorToFile(flavor: ResumeFlavor, id?: string): FlavorFile {
  const defaults = defaultSectionVisibility();
  const sections: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(flavor.sections)) {
    if (defaults[key] !== value) sections[key] = value;
  }

  const dropEmpty = <T extends object>(map: Record<string, T>): Record<string, T> =>
    Object.fromEntries(Object.entries(map).filter(([, v]) => Object.keys(v).length > 0));

  const work = dropEmpty(flavor.work);
  const projects = dropEmpty(flavor.projects);

  return {
    id: id ?? flavor.id,
    label: flavor.label,
    description: flavor.description,
    tagline: flavor.tagline,
    expertise: flavor.expertise,
    accent: flavor.accent,
    statement: flavor.statement,
    ...(Object.keys(sections).length ? { sections } : {}),
    ...(Object.keys(work).length ? { work } : {}),
    ...(Object.keys(projects).length ? { projects } : {}),
  };
}

/** Slug suitable for a flavor id and filename. */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "custom"
  );
}
