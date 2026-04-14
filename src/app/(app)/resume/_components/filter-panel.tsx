"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Download, RotateCcw, X, ChevronDown } from "lucide-react";
import type { FilterState, MatchResult } from "../_lib/resume-filters";
import type { ResumeWork, SectionKey } from "../_lib/resume-types";
import { ROLE_VARIANTS } from "../_lib/resume-variants";

const SECTION_LABELS: Record<SectionKey, string> = {
  work: "Work Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  interests: "Interests",
  awards: "Awards",
  references: "References",
};

interface FilterPanelProps {
  filters: FilterState;
  allTags: string[];
  workEntries: ResumeWork[];
  workMatches: Map<number, MatchResult>;
  projectMatches: Map<number, MatchResult>;
  totalWork: number;
  totalProjects: number;
  onFiltersChange: (filters: FilterState) => void;
  onExport: () => void;
  onClose?: () => void;
}

export function FilterPanel({
  filters,
  allTags,
  workEntries,
  workMatches,
  projectMatches,
  totalWork,
  totalProjects,
  onFiltersChange,
  onExport,
  onClose,
}: FilterPanelProps) {
  const matchedWork = Array.from(workMatches.values()).filter(
    (m) => m.matched,
  ).length;
  const matchedProjects = Array.from(projectMatches.values()).filter(
    (m) => m.matched,
  ).length;

  const setVariant = (variantId: string) => {
    const variant = ROLE_VARIANTS.find((v) => v.id === variantId);
    if (!variant) return;
    onFiltersChange({
      ...filters,
      activeVariant: variantId,
      selectedTags: variant.tags,
      sections: variant.sections,
      jobVisibility: {}, // reset manual overrides when switching variants
    });
  };

  const toggleTag = (tag: string) => {
    const next = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onFiltersChange({ ...filters, selectedTags: next, activeVariant: "all" });
  };

  const toggleSection = (key: SectionKey) => {
    onFiltersChange({
      ...filters,
      sections: { ...filters.sections, [key]: !filters.sections[key] },
    });
  };

  const toggleJob = (companyName: string, currentlyVisible: boolean) => {
    onFiltersChange({
      ...filters,
      jobVisibility: {
        ...filters.jobVisibility,
        [companyName]: !currentlyVisible,
      },
    });
  };

  const currentVariant = ROLE_VARIANTS.find(
    (v) => v.id === filters.activeVariant,
  );

  // Compute which jobs are visible (variant default + manual overrides)
  const getJobVisible = (entry: ResumeWork): boolean => {
    // Manual override takes priority
    if (entry.name in filters.jobVisibility) {
      return filters.jobVisibility[entry.name];
    }
    // Then check variant
    if (currentVariant) {
      const override = currentVariant.jobOverrides[entry.name];
      if (override?.hidden) return false;
    }
    return true;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold">Filters</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setVariant("all")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 pb-2 text-xs text-muted-foreground">
        Showing {matchedWork}/{totalWork} jobs, {matchedProjects}/
        {totalProjects} projects
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Role variant */}
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Target Role
          </Label>
          <Select value={filters.activeVariant} onValueChange={setVariant}>
            <SelectTrigger className="mt-1.5 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_VARIANTS.map((v) => (
                <SelectItem key={v.id} value={v.id} className="text-xs">
                  <div>
                    <div>{v.label}</div>
                    <div className="text-muted-foreground text-[10px]">
                      {v.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sections */}
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sections
          </Label>
          <div className="mt-2 space-y-2">
            {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`section-${key}`} className="text-xs">
                  {SECTION_LABELS[key]}
                </Label>
                <Switch
                  id={`section-${key}`}
                  checked={filters.sections[key]}
                  onCheckedChange={() => toggleSection(key)}
                  className="scale-75"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Per-job visibility */}
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer">
              Jobs
            </Label>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-1.5">
              {workEntries
                .filter((e) => e.name !== "LacyMorrow.com")
                .map((entry) => {
                  const visible = getJobVisible(entry);
                  return (
                    <div
                      key={entry.name}
                      className="flex items-start gap-2"
                    >
                      <Checkbox
                        id={`job-${entry.name}`}
                        checked={visible}
                        onCheckedChange={() => toggleJob(entry.name, visible)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`job-${entry.name}`}
                        className="text-xs leading-tight cursor-pointer"
                      >
                        <span className="font-medium">{entry.name}</span>
                        <span className="text-muted-foreground block">
                          {entry.position}
                        </span>
                      </label>
                    </div>
                  );
                })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Tag matching */}
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tag Matching
          </Label>
          <Select
            value={filters.tagMatchMode}
            onValueChange={(v) =>
              onFiltersChange({
                ...filters,
                tagMatchMode: v as "any" | "all",
              })
            }
          >
            <SelectTrigger className="mt-1.5 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any" className="text-xs">
                Match any tag
              </SelectItem>
              <SelectItem value="all" className="text-xs">
                Match all tags
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Technologies
            </Label>
            {filters.selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-xs px-1"
                onClick={() =>
                  onFiltersChange({ ...filters, selectedTags: [] })
                }
              >
                Clear
              </Button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={
                  filters.selectedTags.includes(tag) ? "default" : "outline"
                }
                className="cursor-pointer text-xs transition-colors"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <div className="p-4">
        <Button onClick={onExport} className="w-full gap-2" size="sm">
          <Download className="h-3.5 w-3.5" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}
