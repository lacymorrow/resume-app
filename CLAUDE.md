# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This app serves the resume at resume.lacy.sh and nothing else. It started as a
ShipKit app and kept its marketing, auth, dashboard, admin, docs, blog, CMS,
and payment routes; those routes are gone but the libraries behind them still
live under `src/` because deleting them would touch runtime code.

## Essential Development Commands

### Development Server
```bash
bun dev             # Start development server
bun run dev:https   # Start development server with HTTPS
```

### Testing
```bash
bun run test           # Run all tests
bun run test:watch     # Run tests in watch mode
bun run test:coverage  # Run tests with coverage
bun run test:browser   # Run browser tests with Vitest
bun run test:node      # Run Node.js tests
bun run test:e2e       # Run Playwright E2E tests
```

### Linting & Type Checking
```bash
bun run lint           # Run all linting (Biome, ESLint, Prettier)
bun run lint:fix       # Fix all linting issues
bun run typecheck      # Run TypeScript type checking
```

### Build & Deployment
```bash
bun run build          # Build for production (runs validate:resume first)
bun run build:vercel   # Build with increased memory (4GB heap)
bun start              # Start production server
bun run analyze        # Analyze bundle size
```

### Resume flavors
```bash
bun run validate:resume  # structural check over resume.json + flavors (gates the build)
bun run flavor <posting>  # generate a flavor from a job posting
bun run flavor <posting> --dry-run  # print the selection without generating
```

The generator lives in `scripts/flavor/`, built as an ordered pipeline in the
same shape as [shipx](https://github.com/lacymorrow/shipx): `cli.ts` parses
flags and drives `steps/*` in a fixed order, and clack handles the prompts.

The load-bearing decision is that **visibility is computed, not generated**.
`steps/select.ts` ranks entries by tag overlap with the posting; the model in
`steps/prose.ts` only writes prose, and only over entries that survived. That is
what makes a generated flavor reviewable rather than something to trust: the
scores and reasons print as a table, and the same posting gives the same cuts.

`steps/verify.ts` is the other half: a rewritten summary may not introduce a
number or a technology absent from the source entry, and an override key that
does not match an entry name is an error. Flavor overrides are keyed by entry
name, so a mismatched key is silently ignored by the renderer, which is the
same failure `src/resume/lib/validate.ts` exists to catch.

Generation shells out to the `claude` CLI in print mode rather than an SDK, so
there is no API key in `.env` for a public repo to leak. Unit tests for the
deterministic stages are in `tests/unit/resume/`.

## File Structure

```
src/
├── app/                    # Next.js App Router, resume routes only
│   ├── layout.tsx         # The only root layout (no chrome, no Suspense)
│   ├── page.tsx           # Default flavor, served at "/"
│   ├── [flavor]/          # One prerendered page per flavor
│   └── not-found.tsx      # 404, every other path lands here
├── resume/                # The resume engine (data, flavors, viewer)
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
└── content/               # Static content (MDX, JSON)
```

`src/server/`, `src/config/`, and other directories carry ShipKit code that is
present but not routed. Do not build on top of it without a specific reason.

## Styling the Resume

The resume is styled with inline styles plus one stylesheet, `RESUME_CSS` in
`src/resume/components/frame.tsx`, for the rules inline styles cannot express:
hover, responsive, and print.

Print rules live there rather than in `globals.css` so they can read the print
palette out of `resume.config.ts` instead of restating its hex values. They also
have to be `!important`: the screen theme is applied as inline styles, and only
an important author rule outranks those.

`globals.css` is shared ShipKit styling. Be careful adding resume rules to it:
`.resume-entry` is a class the frame uses, and a leftover rule there matching
it is invisible until you look at the rendered page.

Switching flavor is a navigation between prerendered pages, so it cross-fades
through the View Transitions API. ShipKit already ships that: `next-view-
transitions` holds the transition open until the new route commits, and its
`ViewTransitions` provider is mounted in the root layout, not through
`components/layouts/app-router-layout.tsx`, which drags in the next/app nuqs
adapter and would cost the app its static rendering.

What the library does not do is respect reduced motion, or know that this page
animates its colours; `src/resume/lib/transitions.ts` is only those two things.
The look is the `::view-transition-*` rules in `RESUME_CSS`.

## Adding New Routes

Prefer not to. Every single-segment path is a resume flavor, so a new top-level
route collides with the flavor namespace, see the URLs section of README.md and
`site.flavorPrefix` in `resume.config.ts` before adding one.

1. Create the route directly under `src/app/` (there are no route groups left).
2. Use Server Components when possible.
3. Do not add a `loading.tsx` above the resume: a Suspense boundary there is
   what used to stop the resume rendering without JavaScript.

## Troubleshooting

- **Type errors**: run `bun run typecheck` and fix before proceeding.
- **Linting failures**: run `bun run lint:fix` to auto-fix issues.
- **Build failures**: try `bun run clean` then `bun run build`.
- **OOM during build**: use `bun run build:vercel` for larger builds.

Always run `bun run lint` and `bun run typecheck` before committing changes.
