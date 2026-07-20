# Relay Activity GC reproduction

Minimal reproduction of a Relay 21 partial read when a Next.js 16 App Router
route is restored after its query owner has been released and a linked record
has been garbage-collected.

This repository accompanies:

- [cookieplace/crepe#7402](https://github.com/cookieplace/crepe/pull/7402)
- [PJM-1564](https://linear.app/cookieplace/issue/PJM-1564)
- [Sentry YOSHI-WEB-AE](https://cookieplace.sentry.io/issues/YOSHI-WEB-AE)
- [ellemedit/relay patch fork](https://github.com/ellemedit/relay)

## Versions

- Next.js 16.2.9 with `cacheComponents: true`
- React / React DOM 19.2.6
- React Relay / Relay Runtime / Relay Compiler 21.0.1
- Playwright 1.61.1

## What it demonstrates

Route A reads:

```text
User:user:1
└── profile → Profile:profile:1
```

The churn routes retain the same `User` but do not select `profile`. The final
route releases Route A's captured public `environment.retain()` disposable and
flushes callbacks scheduled through Relay's public `gcScheduler` option.
`User:user:1` remains reachable through the current query while
`Profile:profile:1` is collected.

Restoring Route A then reuses Relay's completed query resource. Unpatched Relay
returns a partial fragment snapshot instead of issuing a new `AQuery`; the
unguarded `data.profile.label` read reaches Route A's error boundary.

The explicit retain release is a deterministic stand-in for the production
route-owner cleanup. It does not call `Store.__gc()`, mutate `RecordSource`, or
import React `Activity` directly. Navigation and route preservation still go
through the real Next App Router.

## Run

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm repro
```

Run both the control and reproduction:

```bash
pnpm test
```

Expected result:

```text
2 passed
```

The reproduction test passes when it observes all of the following:

1. Next preserves Route A while navigating through client routes.
2. Relay's scheduled mark-and-sweep removes only the linked Profile record.
3. Restoring Route A reaches the local error boundary through
   `data.profile.label`.

The control follows the same navigation without releasing/flushing Route A and
must restore the profile normally.

## Scripts

- `pnpm relay` — generate Relay artifacts
- `pnpm build` — compile artifacts and create a production Next build
- `pnpm test` — build and run all Playwright tests
- `pnpm repro` — run only the PJM-1564 reproduction

Generated Relay artifacts, Next output, Playwright reports, and test results are
ignored.
