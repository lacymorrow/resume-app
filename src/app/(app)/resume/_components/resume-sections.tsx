"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { ResumeSchema, ResumeWork, ResumeProject } from "../_lib/resume-types";
import type { MatchResult } from "../_lib/resume-filters";
import { ResumeEntryCard, formatDateRange } from "./resume-entry-card";

interface SectionProps { title: string; children: React.ReactNode; visible?: boolean; }

export function Section({ title, children, visible = true }: SectionProps) {
  if (!visible) return null;
  return (
    <section className="mb-14">
      <div className="mb-6 flex items-center gap-4">
        <h2 className="font-serif text-2xl font-light tracking-tight text-foreground/80">{title}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
      </div>
      {children}
    </section>
  );
}

export function WorkSection({ entries, matches, tags }: {
  entries: (ResumeWork & { originalIndex: number })[];
  matches: Map<number, MatchResult>;
  tags: Map<number, string[]>;
}) {
  return (
    <div>
      <AnimatePresence initial={false} mode="popLayout">
        {entries.map((entry) => (
          <motion.div key={`${entry.name}-${entry.startDate}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            layout>
            <ResumeEntryCard title={entry.position} subtitle={entry.name}
              dateRange={formatDateRange(entry.startDate, entry.endDate)} location={entry.location}
              summary={entry.summary} tags={tags.get(entry.originalIndex) ?? []} url={entry.url}
              highlights={entry.highlights?.filter(Boolean)} match={matches.get(entry.originalIndex)}
              sector={entry.sector} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ProjectsSection({ entries, matches, tags }: {
  entries: (ResumeProject & { originalIndex: number })[];
  matches: Map<number, MatchResult>;
  tags: Map<number, string[]>;
}) {
  return (
    <div>
      <AnimatePresence initial={false} mode="popLayout">
        {entries.map((project) => (
          <motion.div key={`${project.name}-${project.startDate}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            layout>
            <ResumeEntryCard title={project.name}
              subtitle={project.summary.split(".")[0] ?? ""} dateRange={formatDateRange(project.startDate, project.endDate)}
              summary={project.summary} tags={tags.get(project.originalIndex) ?? []} url={project.url}
              highlights={project.highlights?.filter(Boolean)} match={matches.get(project.originalIndex)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function SkillsSection({ skills }: { skills: ResumeSchema["skills"] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {skills.map((group) => (
        <div key={group.name} className="space-y-2">
          <div className="flex items-baseline gap-2">
            <h3 className="font-serif text-base font-semibold text-foreground">{group.name}</h3>
            <span className="text-xs font-light italic text-primary/60">{group.level}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.keywords.map((kw) => (
              <Badge key={kw} variant="outline"
                className="border-border/50 bg-transparent text-[11px] font-normal text-muted-foreground">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EducationSection({ education }: { education: ResumeSchema["education"] }) {
  return (
    <div className="space-y-5">
      {education.map((edu) => (
        <div key={edu.institution}>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            {edu.studyType} — {edu.area}
          </h3>
          <p className="text-sm text-muted-foreground">{edu.institution}</p>
          <p className="font-serif text-xs uppercase tracking-[0.15em] text-primary/60">
            {formatDateRange(edu.startDate, edu.endDate)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ExtrasSection({ interests, awards, references, showInterests, showAwards, showReferences }: {
  interests: ResumeSchema["interests"]; awards: ResumeSchema["awards"]; references: ResumeSchema["references"];
  showInterests: boolean; showAwards: boolean; showReferences: boolean;
}) {
  return (
    <>
      {showInterests && interests.length > 0 && (
        <Section title="Interests">
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <Badge key={i.name} variant="outline"
                className="border-border/50 bg-transparent text-xs font-normal text-muted-foreground">
                {i.name}
              </Badge>
            ))}
          </div>
        </Section>
      )}
      {showAwards && awards.length > 0 && (
        <Section title="Awards">
          {awards.map((a) => (
            <div key={a.title} className="text-sm">
              <span className="font-serif font-semibold text-foreground">{a.title}</span>
              <span className="text-muted-foreground"> — {a.awarder}, {new Date(a.date).getUTCFullYear()}</span>
            </div>
          ))}
        </Section>
      )}
      {showReferences && references.length > 0 && (
        <Section title="References">
          <div className="space-y-4">
            {references.map((r) => (
              <blockquote key={r.name} className="border-l-2 border-primary/25 pl-5">
                <p className="font-serif text-sm italic leading-relaxed text-foreground/70">
                  &ldquo;{r.reference}&rdquo;
                </p>
                <footer className="mt-1.5 text-xs font-medium text-primary/70">— {r.name}</footer>
              </blockquote>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
