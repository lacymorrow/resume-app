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
| `/r/<flavor>` | One page per flavor file, e.g. `/r/frontend` |
| `?hc=`, `?hp=`, `?tags=`, `?match=`, `?off=` | Builder state, applied in the browser |

The `r` prefix is `site.flavorPrefix` in `resume.config.ts`. App Router folder
names are static, so changing it means renaming `src/app/(resume)/r` to match —
`bun run validate:resume` fails the build if the two disagree.

Flavors are paths and builder state is query parameters for a reason: a flavor
is a published variant that should prerender to a static file, while builder
state is per-visitor tuning that a static file cannot vary on. That tuning is
therefore applied after the page mounts. Legacy `/?flavor=<id>` links redirect
to `/r/<id>`.

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
