import type { ResumeBasics } from "../_lib/resume-types";
import { Globe, Mail, Phone, Github, Linkedin, Twitter, MapPin } from "lucide-react";

const NETWORK_ICONS: Record<string, typeof Globe> = {
  github: Github, linkedin: Linkedin, twitter: Twitter,
};

function parseExpertise(summary: string): { intro: string; expertise: string | null } {
  const paragraphs = summary.split("\n\n");
  const intro = paragraphs[0] ?? "";
  const expertiseParagraph = paragraphs.find((p) => p.startsWith("EXPERTISE:"));
  const expertise = expertiseParagraph?.replace("EXPERTISE: ", "") ?? null;
  return { intro, expertise };
}

export function ResumeHeader({ basics }: { basics: ResumeBasics }) {
  const { intro, expertise } = parseExpertise(basics.summary);
  const location = [basics.location.city, basics.location.state].filter(Boolean).join(", ");

  return (
    <header className="mb-12">
      {/* Name + Title block */}
      <div className="mb-6">
        <h1 className="font-serif text-5xl font-light tracking-tight sm:text-6xl text-foreground">
          {basics.name}
        </h1>
        <p className="mt-2 font-serif text-lg italic text-primary sm:text-xl">
          {basics.label}
        </p>
      </div>

      {/* Contact bar — elegant horizontal layout */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border/60 py-3 text-sm text-muted-foreground">
        {location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary/60" />
            {location}
          </span>
        )}
        <a href={`tel:${basics.phone}`} className="flex items-center gap-1.5 transition-colors hover:text-primary">
          <Phone className="h-3.5 w-3.5 text-primary/60" />
          {basics.phone}
        </a>
        <a href={basics.url} className="flex items-center gap-1.5 transition-colors hover:text-primary">
          <Globe className="h-3.5 w-3.5 text-primary/60" />
          {basics.url.replace("http://", "")}
        </a>
        <a href={`mailto:${basics.email}`} className="flex items-center gap-1.5 transition-colors hover:text-primary">
          <Mail className="h-3.5 w-3.5 text-primary/60" />
          {basics.email}
        </a>

        {/* Social links inline */}
        <div className="flex items-center gap-3 ml-auto">
          {basics.profiles.map((profile) => {
            const Icon = NETWORK_ICONS[profile.network.toLowerCase()] ?? Globe;
            return (
              <a key={profile.network} href={profile.url} target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground/60 transition-colors hover:text-primary">
                <Icon className="h-4 w-4" />
              </a>
            );
          })}
        </div>
      </div>

      {/* Summary with drop cap */}
      <p className="resume-dropcap mt-6 text-[15px] leading-relaxed text-foreground/85 max-w-prose">
        {intro}
      </p>

      {/* Expertise as refined inline list */}
      {expertise && (
        <div className="mt-4 flex flex-wrap items-baseline gap-x-1.5 text-xs tracking-wide text-muted-foreground">
          <span className="font-serif text-sm font-semibold italic text-primary/70 mr-1">Expertise</span>
          {expertise.split(";").map((item) => (
            <span key={item.trim()} className="after:content-['·'] after:ml-1.5 after:text-border last:after:content-none">
              {item.trim()}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
