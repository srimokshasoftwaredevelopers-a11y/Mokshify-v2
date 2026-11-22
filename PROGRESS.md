# Redesign progress

Resume from here. Spec: `REDESIGN_SPEC.md`. Decisions: `DECISIONS.md`.

## Status

| Phase | State |
|---|---|
| 0 Audit | Done (`REDESIGN_AUDIT.md`) |
| 1 Structure + tokens | In progress |
| 2 Shell components | Not started |
| 3 One page per template + review | Not started |
| 4 Rollout | Not started |
| 5 Fixes + checks + report | Not started |

## Done so far

- `film-v1` tagged locally (push refused, see DECISIONS Unresolved).
- `css/site.css` started: tokens, base, layout, spine, motion, shell, components.
- `partials/` head, nav, footer; `scripts/build.mjs` include stamper; `js/site.js` shell behaviour.
- `scripts/redesign/migrate-shell.mjs` (dry run clean on all 66 inner pages, not yet applied).

## Next

1. Split CSS source into `css/src/{tokens,base,components,templates}.css`, build concatenates to `css/site.css`.
2. Partials: add `mega-menu`, `cta-band`, `contact-bar`; nav phone number.
3. Apply the migration, build, serve, screenshot.
