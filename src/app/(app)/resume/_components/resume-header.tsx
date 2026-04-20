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
    <header className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{basics.name}</h1>
          <p className="mt-1 text-base text-muted-foreground sm:text-lg">{basics.label}</p>
          {location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground/70">
              <MapPin className="h-3 w-3" />{location}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground sm:flex-col sm:items-end sm:gap-1">
          <a href={`tel:${basics.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
            <Phone className="h-3.5 w-3.5" />{basics.phone}
          </a>
          <a href={basics.url} className="flex items-center gap-1.5 hover:text-foreground">
            <Globe className="h-3.5 w-3.5" />{basics.url.replace("http://", "")}
          </a>
          <a href={`mailto:${basics.email}`} className="flex items-center gap-1.5 hover:text-foreground">
            <Mail className="h-3.5 w-3.5" />{basics.email}
          </a>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        {basics.profiles.map((profile) => {
          const Icon = NETWORK_ICONS[profile.network.toLowerCase()] ?? Globe;
          return (
            <a key={profile.network} href={profile.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              <Icon className="h-4 w-4" />
            </a>
          );
        })}
      </div>
      <p className="mt-4 text-sm leading-relaxed">{intro}</p>
      {expertise && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">Expertise:</span>{" "}
          {expertise}
        </p>
      )}
    </header>
  );
}
