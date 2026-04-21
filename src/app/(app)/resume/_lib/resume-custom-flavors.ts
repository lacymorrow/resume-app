"use client";

import type { ResumeFlavor } from "./resume-flavors";
import type { FilterState } from "./resume-filters";
import type { SectionKey } from "./resume-types";

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
    return [];
  }
}

export function saveCustomFlavor(flavor: CustomFlavor): void {
  const existing = loadCustomFlavors().filter((f) => f.id !== flavor.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, flavor]));
}

export function deleteCustomFlavor(id: string): void {
  const existing = loadCustomFlavors().filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/** Build a CustomFlavor snapshot from current filter state and a display name */
export function filterStateToCustomFlavor(
  filters: FilterState,
  name: string,
  baseFlavor: ResumeFlavor,
): CustomFlavor {
  const id = `custom-${Date.now()}`;
  return {
    id,
    label: name,
    description: "Custom flavor",
    tagline: baseFlavor.tagline,
    expertise: baseFlavor.expertise,
    sections: filters.sections as Record<SectionKey, boolean>,
    work: {
      ...baseFlavor.work,
      // mark user-hidden companies as not visible
      ...Object.fromEntries(filters.hiddenCompanies.map((c) => [c, { visible: false }])),
    },
    projects: {
      ...baseFlavor.projects,
      ...Object.fromEntries(filters.hiddenProjects.map((p) => [p, { visible: false }])),
    },
    isCustom: true,
    hiddenCompanies: filters.hiddenCompanies,
    hiddenProjects: filters.hiddenProjects,
    createdAt: Date.now(),
  };
}
