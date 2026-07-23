"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ResumeSchema, ResumeWork, ResumeProject } from "../_lib/resume-types";
import type { MatchResult } from "../_lib/resume-filters";
import { SIGNATURE, SIGNATURE_FONT_STACK, formatYearRange, FOOTER_TEXT } from "../_lib/resume-export-shared";
import { ResumeEntryCard } from "./resume-entry-card";

interface SectionProps {
  rail: string;
  children: React.ReactNode;
  visible?: boolean;
}

export function Section({ rail, children, visible = true }: SectionProps) {
  if (!visible) return null;
  return (
    <section
      className="grid gap-x-4 sm:gap-x-5 mt-7 print:mt-5"
      style={{
        gridTemplateColumns: "76px 1fr",
        fontFamily: SIGNATURE_FONT_STACK,
      }}
    >
      <div
        className="text-[8.5pt] font-bold uppercase leading-snug pt-0.5 hidden sm:block"
        style={{ color: SIGNATURE.rail, letterSpacing: "0.14em" }}
      >
        {rail}
      </div>
      {/* Mobile rail label */}
      <div
        className="sm:hidden col-span-full text-[9pt] font-bold uppercase mb-2"
        style={{ color: SIGNATURE.rail, letterSpacing: "0.14em" }}
      >
        {rail}
      </div>
      <div className="min-w-0 col-start-1 sm:col-start-2">{children}</div>
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
          <motion.div
            key={`${entry.name}-${entry.startDate}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            layout
          >
            <ResumeEntryCard
              title={entry.position}
              subtitle={entry.name}
              startDate={entry.startDate}
              endDate={entry.endDate}
              location={entry.location}
              summary={entry.summary ?? ""}
              tags={tags.get(entry.originalIndex) ?? []}
              url={entry.url}
              highlights={entry.highlights?.filter(Boolean)}
              match={matches.get(entry.originalIndex)}
              sector={entry.sector}
              variant="work"
            />
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
          <motion.div
            key={`${project.name}-${project.startDate}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            layout
          >
            <ResumeEntryCard
              title={project.name}
              subtitle={project.url ? new URL(project.url).hostname : ""}
              startDate={project.startDate}
              endDate={project.endDate}
              summary={project.summary ?? ""}
              tags={tags.get(project.originalIndex) ?? []}
              url={project.url}
              highlights={project.highlights?.filter(Boolean)}
              match={matches.get(project.originalIndex)}
              featured={project.featured}
              variant="project"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function SkillsSection({ skills }: { skills: ResumeSchema["skills"] }) {
  return (
    <div>
      {skills.map((group) => (
        <div key={group.name} className="mb-0.5 text-sm" style={{ color: SIGNATURE.body }}>
          <span className="font-bold" style={{ color: SIGNATURE.ink }}>{group.name}:</span>{" "}
          {group.keywords.join(" / ")}{" "}
          <span className="italic" style={{ color: SIGNATURE.muted }}>: {group.level}</span>
        </div>
      ))}
    </div>
  );
}

export function EducationSection({ education }: { education: ResumeSchema["education"] }) {
  return (
    <div>
      {education.map((edu) => (
        <div key={edu.institution} className="mb-2 text-sm" style={{ color: SIGNATURE.body }}>
          <strong style={{ color: SIGNATURE.ink }}>
            {edu.studyType} — {edu.area}
          </strong>
          <br />
          <span style={{ color: SIGNATURE.muted }}>
            {formatYearRange(edu.startDate, edu.endDate)} | {edu.institution}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PersonalSection({ skills, interests, education, awards, qualities, showSkills, showInterests, showEducation, showAwards }: {
  skills: ResumeSchema["skills"];
  interests: ResumeSchema["interests"];
  education: ResumeSchema["education"];
  awards: ResumeSchema["awards"];
  qualities: string | null;
  showSkills: boolean;
  showInterests: boolean;
  showEducation: boolean;
  showAwards: boolean;
}) {
  const hasContent =
    (showSkills && skills.length > 0) ||
    (showInterests && interests.length > 0) ||
    qualities ||
    (showEducation && education.length > 0) ||
    (showAwards && awards.length > 0);

  if (!hasContent) return null;

  return (
    <div>
      {showSkills && skills.length > 0 && (
        <SubEntry label={<><span style={{ color: SIGNATURE.pink }}>♥</span> TECH<br />STACK</>}>
          <SkillsSection skills={skills} />
        </SubEntry>
      )}
      {showInterests && interests.length > 0 && (
        <SubEntry label="INTERESTS">
          <p className="text-sm" style={{ color: SIGNATURE.body }}>
            {interests.map((i) => i.name).join(", ")}
          </p>
        </SubEntry>
      )}
      {qualities && (
        <SubEntry label="QUALITIES">
          <p className="text-sm" style={{ color: SIGNATURE.body }}>{qualities}</p>
        </SubEntry>
      )}
      {showEducation && education.length > 0 && (
        <SubEntry label="EDUCATION">
          <EducationSection education={education} />
        </SubEntry>
      )}
      {showAwards && awards.length > 0 && (
        <SubEntry label="AWARDS">
          {awards.map((a) => (
            <p key={a.title} className="text-sm" style={{ color: SIGNATURE.body }}>
              <strong style={{ color: SIGNATURE.ink }}>{a.title}</strong> — {a.awarder},{" "}
              {new Date(a.date).getUTCFullYear()}
            </p>
          ))}
        </SubEntry>
      )}
    </div>
  );
}

function SubEntry({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="grid gap-x-4 mb-4"
      style={{ gridTemplateColumns: "128px 1fr" }}
    >
      <div
        className="text-right text-[8.5pt] font-bold uppercase leading-snug hidden sm:block"
        style={{ color: SIGNATURE.rail, letterSpacing: "0.12em" }}
      >
        {label}
      </div>
      <div className="min-w-0 col-start-1 sm:col-start-2">{children}</div>
    </div>
  );
}

export function ReferencesSection({ references }: { references: ResumeSchema["references"] }) {
  return (
    <div>
      {references.map((r) => (
        <blockquote key={r.name} className="mb-3 text-sm italic" style={{ color: SIGNATURE.muted }}>
          &ldquo;{r.reference}&rdquo;
          <footer className="mt-1 not-italic text-xs font-medium" style={{ color: SIGNATURE.ink }}>
            — {r.name}
          </footer>
        </blockquote>
      ))}
    </div>
  );
}

export function ResumeFooter() {
  return (
    <footer
      className="mt-8 text-center text-xs print:mt-6"
      style={{ color: SIGNATURE.footer }}
    >
      {FOOTER_TEXT.replace("lacymorrow.com", "")}{" "}
      <a
        href="https://lacymorrow.com"
        className="underline"
        style={{ color: SIGNATURE.footer }}
      >
        lacymorrow.com
      </a>
    </footer>
  );
}
