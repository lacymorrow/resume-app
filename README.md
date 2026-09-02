# resume.lacy.sh

Interactive resume for Lacy Morrow — full-stack engineer, AI tooling, and product builder.

Live at [resume.lacy.sh](https://resume.lacy.sh)

## Features

- Interactive resume viewer with filtering by role, technology, and date range
- Multiple resume flavors (full-stack, frontend, backend, AI/ML, management)
- Export as PDF, DOCX, or HTML
- URL-based state management for shareable filtered views
- Print-optimized layout
- Responsive design

## URLs

Each flavor is its own page, prerendered at build time so it is cacheable and
crawlable:

| URL | What it is |
| --- | --- |
| `/` | The default flavor — the first entry in `flavors/index.ts` |
| `/<flavor>` | One page per flavor file, e.g. `/frontend` |
| `?hc=`, `?hp=`, `?tags=`, `?match=`, `?off=` | Builder state, applied in the browser |

Flavors sit at the root. `site.flavorPrefix` in `resume.config.ts` can move
them under a segment instead — `"r"` gives `/r/frontend` — which you want if
the site also serves root-level pages of its own, since any single-segment path
that is not a flavor now 404s. App Router folder names are static, so changing
the prefix means renaming `src/app/[flavor]` to match;
`bun run validate:resume` fails the build if the two disagree.

Flavors are paths and builder state is query parameters for a reason: a flavor
is a published variant that should prerender to a static file, while builder
state is per-visitor tuning that a static file cannot vary on. That tuning is
therefore applied after the page mounts. Legacy `/?flavor=<id>` links redirect
to `/<id>`.

Nothing else is routed. This started as a ShipKit app and kept its marketing,
auth, dashboard, admin, docs, blog, CMS, and payment routes; they are gone, so
every path other than the ones above is a 404. The libraries behind them still
sit in `src/` — deleting a route does not delete its supporting code.

## Flavors

A flavor is a JSON overlay on `resume.json`: a tagline, an expertise line, an
accent, an opening statement, and per-entry overrides that hide a job or rewrite
its summary. `flavors/*.json` holds them and `flavors/index.ts` is the registry —
a file on disk does nothing until it is in that array.

### Generating one from a job posting

```bash
bun run flavor posting.txt --id acme-platform
pbpaste | bun run flavor --id acme-platform
bun run flavor posting.txt --dry-run   # print the selection, generate nothing
```

The pipeline is deliberately lopsided:

1. **Read** the posting in the resume's own tag vocabulary, so `nextjs`,
   `postgres`, and `i18n` land on `Next.js`, `PostgreSQL`, and `Localization`
   rather than on nothing.
2. **Score and select**, deterministically. Every work entry and project is
   ranked by tag overlap; the newest roles are kept whatever they score, because
   a resume that skips the last two years reads as an employment gap. The same
   posting gives the same cuts, and the CLI prints them as a table with the
   reason for each.
3. **Write the prose** — and only the prose. A model sees the posting and the
   entries that survived, and returns the tagline, expertise, statement, and at
   most a handful of re-angled summaries. It never decides what is visible and
   never sees an entry that was dropped.
4. **Check it.** A rewritten summary may not introduce a number or a technology
   the original entry did not have, and an override key that does not match an
   entry name is an error rather than a silent no-op. The result is then run
   through the same validation as `bun run validate:resume`.

The CLI also reports what the posting asks for that the resume cannot answer —
the honest counterweight to a variant tuned to look like a match.

Generation drives the [`claude`](https://claude.com/claude-code) CLI in print
mode, so there is no API key to configure. `--help` lists the rest.

## Stack

- [Next.js 15](https://nextjs.org) with App Router
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Bun](https://bun.sh)

## Development

```bash
bun install
bun dev
```

## Build

```bash
bun run build
```

## License

MIT
