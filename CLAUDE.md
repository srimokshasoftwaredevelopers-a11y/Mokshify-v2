# Mokshify (mokshify.io): rules for every session

These rules come first. They apply to every person and every AI session working in this repo.

1. **Production deploys happen only from the `main` branch on GitHub.** Never run a Vercel deploy command (`vercel`, `vercel --prod`, `vercel deploy`, `vercel promote`) from a local folder.
2. **Before any work, fetch and start from the current `origin/main`.** Run `git fetch origin` and branch from `origin/main`. Never work from an older local copy.
3. **Stage files by name only.** Never use `git add -u`, `git add -A` or `git add .`.
4. **Every change goes through a branch, the build checks, and a merge to `main`.** No direct uploads.
5. **Image rules:** no real people, no prices, no plot-level sale status. Images also carry no readable text, logos or brand names unless they are a labelled client screenshot.
6. **Copy rules:** no long dashes (em or en dash, and no " - " used as a dash), and no wording that says AI writes, reviews, checks, tests or approves our work. Describe the pipeline as "automated checks". `/legal/disclosure/` is the only exception.

## Checks before any merge

```sh
npm run build     # stamps partials, minifies, runs the copy rules (fails on a long dash or an AI label)
npm run check     # fails if any page is out of date
npm run serve     # local server on :8123, then:
npm run verify    # crawl, orphans, JSON-LD, contrast, keyboard, reduced motion
```

If any check fails, stop and fix it. Do not merge or push past a failing check.

## More

- Writing and image rules in full: `docs/HANDBOOK.md`.
- Decisions: `DECISIONS.md`. Site layout and commands: `README.md`.
- Case-study rows and generated case studies come from `scripts/redesign/projects.mjs`.
- This file and `AGENTS.md` say the same thing; keep them in step.
