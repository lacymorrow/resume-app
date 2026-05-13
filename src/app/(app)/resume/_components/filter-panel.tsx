"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RotateCcw, X, ChevronDown, ChevronRight, BookmarkPlus, Trash2, FileText, FileCode, Printer } from "lucide-react";
import type { FilterState, MatchResult } from "../_lib/resume-filters";
import type { SectionKey } from "../_lib/resume-types";
import type { ResumeFlavor } from "../_lib/resume-flavors";
import type { CustomFlavor } from "../_lib/resume-custom-flavors";
import type { ExportFormat } from "../_lib/resume-export";

const SECTION_LABELS: Record<SectionKey, string> = {
  work: "Work Experience", projects: "Projects", skills: "Skills",
  education: "Education", interests: "Interests", awards: "Awards", references: "References",
};

interface FilterPanelProps {
  filters: FilterState; allTags: string[];
  workMatches: Map<number, MatchResult>; projectMatches: Map<number, MatchResult>;
  totalWork: number; totalProjects: number;
  flavorCompanies: string[]; flavorProjects: string[];
  allFlavors: ResumeFlavor[];
  customFlavors: CustomFlavor[];
  onFiltersChange: (filters: FilterState) => void;
  onExport: (format: ExportFormat) => void;
  onSaveCustomFlavor: (name: string) => void;
  onDeleteCustomFlavor: (id: string) => void;
  onClose?: () => void;
}

function AnimCount({ val }: { val: number }) {
  return (
    <motion.span
      key={val}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="inline-block tabular-nums font-serif font-semibold text-foreground"
    >
      {val}
    </motion.span>
  );
}

export function FilterPanel({
  filters, allTags, workMatches, projectMatches, totalWork, totalProjects,
  flavorCompanies, flavorProjects, allFlavors, customFlavors,
  onFiltersChange, onExport, onSaveCustomFlavor, onDeleteCustomFlavor, onClose,
}: FilterPanelProps) {
  const matchedWork = Array.from(workMatches.values()).filter((m) => m.matched).length;
  const matchedProjects = Array.from(projectMatches.values()).filter((m) => m.matched).length;
  const [showCompanies, setShowCompanies] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [savingFlavor, setSavingFlavor] = useState(false);
  const [customName, setCustomName] = useState("");

  const setFlavor = (flavorId: string) => {
    const flavor = allFlavors.find((f) => f.id === flavorId);
    if (!flavor) return;
    const cf = flavor as CustomFlavor;
    onFiltersChange({
      ...filters,
      flavorId,
      sections: flavor.sections,
      selectedTags: [],
      hiddenCompanies: cf.hiddenCompanies ?? [],
      hiddenProjects: cf.hiddenProjects ?? [],
    });
  };

  const toggleTag = (tag: string) => {
    const next = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onFiltersChange({ ...filters, selectedTags: next });
  };

  const toggleSection = (key: SectionKey) => {
    onFiltersChange({ ...filters, sections: { ...filters.sections, [key]: !filters.sections[key] } });
  };

  const toggleCompany = (name: string) => {
    const next = filters.hiddenCompanies.includes(name)
      ? filters.hiddenCompanies.filter((c) => c !== name)
      : [...filters.hiddenCompanies, name];
    onFiltersChange({ ...filters, hiddenCompanies: next });
  };

  const toggleProject = (name: string) => {
    const next = filters.hiddenProjects.includes(name)
      ? filters.hiddenProjects.filter((p) => p !== name)
      : [...filters.hiddenProjects, name];
    onFiltersChange({ ...filters, hiddenProjects: next });
  };

  const handleSaveFlavor = () => {
    const name = customName.trim();
    if (!name) return;
    onSaveCustomFlavor(name);
    setCustomName("");
    setSavingFlavor(false);
  };

  const activeFlavor = allFlavors.find((f) => f.id === filters.flavorId);
  const isCustomActive = customFlavors.some((f) => f.id === filters.flavorId);
  const hiddenCount = filters.hiddenCompanies.length + filters.hiddenProjects.length;
  const hasCustomizations = hiddenCount > 0 || filters.selectedTags.length > 0;
  const builtInFlavors = allFlavors.filter((f) => !customFlavors.some((c) => c.id === f.id));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="font-serif text-base font-semibold text-foreground">Resume Builder</h2>
        <div className="flex items-center gap-1">
          {hasCustomizations && !isCustomActive && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
              title="Save as custom flavor" onClick={() => setSavingFlavor((v) => !v)}>
              <BookmarkPlus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Reset to Complete" onClick={() => setFlavor("complete")}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {savingFlavor && (
        <div className="mx-4 mb-2 flex gap-1.5">
          <Input className="h-7 text-xs flex-1" placeholder="Flavor name…"
            value={customName} onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveFlavor(); if (e.key === "Escape") setSavingFlavor(false); }}
            autoFocus />
          <Button size="sm" className="h-7 text-xs px-2" onClick={handleSaveFlavor} disabled={!customName.trim()}>
            Save
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSavingFlavor(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Stats with warm accent */}
      <div className="px-4 pb-3 text-xs text-muted-foreground">
        <AnimCount val={matchedWork} />
        <span className="text-muted-foreground/50">/{totalWork}</span>
        <span className="mx-1">jobs,</span>
        <AnimCount val={matchedProjects} />
        <span className="text-muted-foreground/50">/{totalProjects}</span>
        <span className="ml-1">projects</span>
        {hiddenCount > 0 && (
          <span className="ml-1.5 text-primary/70">
            (<AnimCount val={hiddenCount} /> hidden)
          </span>
        )}
      </div>

      <Separator className="bg-border/50" />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Flavor selector */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="font-serif text-xs font-semibold italic text-primary/70">
              Role / Flavor
            </Label>
            {isCustomActive && (
              <Button variant="ghost" size="sm"
                className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                title="Delete this custom flavor"
                onClick={() => onDeleteCustomFlavor(filters.flavorId)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Select value={filters.flavorId} onValueChange={setFlavor}>
            <SelectTrigger className="mt-1.5 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {builtInFlavors.map((f) => (
                <SelectItem key={f.id} value={f.id} className="text-xs">
                  <span className="font-medium">{f.label}</span>
                  <span className="ml-2 text-muted-foreground">— {f.description}</span>
                </SelectItem>
              ))}
              {customFlavors.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">Saved</div>
                  {customFlavors.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-xs">
                      <span className="font-medium">{f.label}</span>
                      <span className="ml-2 text-muted-foreground">— custom</span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          {activeFlavor && activeFlavor.id !== "complete" && (
            <p className="mt-1.5 text-xs text-muted-foreground/70 italic">
              {isCustomActive ? "Custom: " : "Showing as: "}{activeFlavor.tagline}
            </p>
          )}
        </div>

        {/* Sections */}
        <div>
          <Label className="font-serif text-xs font-semibold italic text-primary/70">Sections</Label>
          <div className="mt-2 space-y-2">
            {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`section-${key}`} className="text-xs">{SECTION_LABELS[key]}</Label>
                <Switch id={`section-${key}`} checked={filters.sections[key]} onCheckedChange={() => toggleSection(key)} className="scale-75" />
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Per-company visibility */}
        {flavorCompanies.length > 0 && (
          <div>
            <button type="button" className="flex w-full items-center justify-between"
              onClick={() => setShowCompanies((v) => !v)}>
              <Label className="pointer-events-none font-serif text-xs font-semibold italic text-primary/70">
                Companies
                {filters.hiddenCompanies.length > 0 && (
                  <span className="ml-1.5 not-italic text-primary/50">({filters.hiddenCompanies.length} hidden)</span>
                )}
              </Label>
              {showCompanies ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            {showCompanies && (
              <div className="mt-2 space-y-2">
                {flavorCompanies.map((name) => {
                  const visible = !filters.hiddenCompanies.includes(name);
                  return (
                    <div key={name} className="flex items-center justify-between">
                      <Label htmlFor={`company-${name}`}
                        className={`text-xs truncate max-w-[160px] ${!visible ? "line-through text-muted-foreground/50" : ""}`}
                        title={name}>
                        {name}
                      </Label>
                      <Switch id={`company-${name}`} checked={visible}
                        onCheckedChange={() => toggleCompany(name)} className="scale-75" />
                    </div>
                  );
                })}
                {filters.hiddenCompanies.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-5 w-full text-xs px-1 justify-start text-primary/60 hover:text-primary"
                    onClick={() => onFiltersChange({ ...filters, hiddenCompanies: [] })}>
                    Show all companies
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Per-project visibility */}
        {flavorProjects.length > 0 && (
          <div>
            <button type="button" className="flex w-full items-center justify-between"
              onClick={() => setShowProjects((v) => !v)}>
              <Label className="pointer-events-none font-serif text-xs font-semibold italic text-primary/70">
                Projects
                {filters.hiddenProjects.length > 0 && (
                  <span className="ml-1.5 not-italic text-primary/50">({filters.hiddenProjects.length} hidden)</span>
                )}
              </Label>
              {showProjects ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            {showProjects && (
              <div className="mt-2 space-y-2">
                {flavorProjects.map((name) => {
                  const visible = !filters.hiddenProjects.includes(name);
                  return (
                    <div key={name} className="flex items-center justify-between">
                      <Label htmlFor={`project-${name}`}
                        className={`text-xs truncate max-w-[160px] ${!visible ? "line-through text-muted-foreground/50" : ""}`}
                        title={name}>
                        {name}
                      </Label>
                      <Switch id={`project-${name}`} checked={visible}
                        onCheckedChange={() => toggleProject(name)} className="scale-75" />
                    </div>
                  );
                })}
                {filters.hiddenProjects.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-5 w-full text-xs px-1 justify-start text-primary/60 hover:text-primary"
                    onClick={() => onFiltersChange({ ...filters, hiddenProjects: [] })}>
                    Show all projects
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <Separator className="bg-border/50" />

        {/* Tag filter */}
        <div>
          <Label className="font-serif text-xs font-semibold italic text-primary/70">
            Tag Matching
          </Label>
          <Select value={filters.tagMatchMode} onValueChange={(v) => onFiltersChange({ ...filters, tagMatchMode: v as "any" | "all" })}>
            <SelectTrigger className="mt-1.5 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any" className="text-xs">Match any tag</SelectItem>
              <SelectItem value="all" className="text-xs">Match all tags</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="font-serif text-xs font-semibold italic text-primary/70">Technologies</Label>
            {filters.selectedTags.length > 0 && (
              <Button variant="ghost" size="sm" className="h-5 text-xs px-1 text-primary/60 hover:text-primary"
                onClick={() => onFiltersChange({ ...filters, selectedTags: [] })}>Clear</Button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <Badge key={tag}
                variant={filters.selectedTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer text-[11px] transition-all ${
                  filters.selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "border-border/60 bg-transparent text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
                onClick={() => toggleTag(tag)}>
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Export section */}
      <div className="p-4 space-y-2">
        <Label className="font-serif text-xs font-semibold italic text-primary/70">Export</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onExport("pdf")} variant="default" className="gap-1.5" size="sm">
            <Download className="h-3.5 w-3.5" />PDF
          </Button>
          <Button onClick={() => onExport("docx")} variant="secondary" className="gap-1.5" size="sm">
            <FileText className="h-3.5 w-3.5" />DOCX
          </Button>
          <Button onClick={() => onExport("html")} variant="secondary" className="gap-1.5" size="sm">
            <FileCode className="h-3.5 w-3.5" />HTML
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="gap-1.5" size="sm">
            <Printer className="h-3.5 w-3.5" />Print
          </Button>
        </div>
      </div>
    </div>
  );
}
