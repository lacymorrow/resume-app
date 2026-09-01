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
