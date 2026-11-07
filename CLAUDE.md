# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Bancal**, a Spanish-language SPA for planning urban vegetable gardens: the user draws raised beds (*bancales*) with real measurements, places crops on a 30 × 30 cm grid, and the app reports **live** which neighbours help or harm each other, whether there is enough sun, and how the garden evolves month by month. Final project of the course *Front End Moderno y Herramientas IA* (Fundación Luckia + Lemoncode): individual, frontend only, simulated data.

Sources of truth:

- `docs/tareas.md` — **the MVP plan**: tasks T1–T17 with checkable criteria `C<n>.<m>`, each tagged with how it is verified (`test`, `build`, `nav`, `leer`, `datos`), plus the common gates, coverage table and the post-MVP iterations list. Work happens task by task, in order.
- `docs/guia-proyecto.md` — the full project guide (scope, domain, stack, quality). **Private: git-ignored, only on the author's machine.** This `CLAUDE.md` is its versioned summary; if the guide is missing, rely on this file and `docs/tareas.md`.
- `docs/brief.md` — visual direction, created in T2 (skill `brief-grill`).

Use the Spanish domain terms (Cultivo, Bancal, Celda, Plantación, Vecindad, Exposición, Zona climática, Estado de la planta, Aviso) in code, UI and conversation.

## Commands

- `npm start` — Vite dev server
- `npm run build` — `vite build && tsc --noEmit`. Order matters: the router plugin generates `src/routeTree.gen.ts` during the Vite build and `tsc` needs it. Never edit that file by hand (a hook blocks it). It is versioned.
- `npm run typecheck`, `npm run preview`
- `npm test` — Vitest, single run (`npm run test:watch` to watch). One test: `npx vitest run <path> -t "<name>"` (test names carry the criterion id, e.g. `"C5.2 · …"`).

Vitest config lives in `vite.config.ts` (jsdom, setup in `src/test/setup.ts`: jest-dom matchers, cleanup, `scrollTo` stub). No Vitest globals: import `describe/it/expect` explicitly. Component tests that need routing render `RouterProvider` with `createMemoryHistory` over the real `routeTree` (see `src/layouts/app-layout.test.tsx`).

## Stack

Node.js ≥ 22.12 on **Windows 11 ARM64** (arm64 builds of native deps). TypeScript 7 strict with `verbatimModuleSyntax` (`import type`), React 19, Vite 8, Tailwind CSS 4 via `@tailwindcss/vite` (tokens in `@theme`, container queries in the editor), TanStack Router file-based (search params validated with Zod), TanStack Form + Zod 4 (Spanish messages), Vitest + Testing Library (`react`, `user-event`, `jest-dom`) + jsdom.

**No dependencies outside this list without justification** (no React Router, TanStack Query, MSW, axe, clsx/cva, animation libraries). Drag & drop uses native Pointer Events; animations use CSS and the View Transitions API.

## Architecture

Same layering as `lab-react` (detail and examples in the skill `react-bancal`):

```
src/
  routes/   navigation only: read params / search params, render a scene
  scenes/   compose a screen and decide navigation
  pods/     catalogo/, bancales/, editor/ — *.container.tsx (data, state) and
            *.component.tsx (props → render); imported only via index.ts, never from each other
  core/     <dominio>/model.ts, *.schema.ts, api.ts, hooks.ts and pure domain logic (+ tests)
  common/   shared components (loading, error…)
```

- **The heart of the project is pure functions in `core/`, built with TDD** (skill `tdd-core`): neighbours of a cell, compatibility, warnings for a bed, plant state in a month, tasks of the month. `core/` imports no React except `hooks.ts`.
- Data: `public/crops.json` (~24 crops) + `localStorage`, behind an **async `api` layer with simulated latency** validated with Zod, so the UI handles loading and error as if there were a backend. Data hooks return `{ data, loading, error }` and cancel with `AbortController`.
- Derived values (warnings, plant states, monthly tasks, counts) are computed during render, never stored. Filters and the month live in the URL.
- Routes: `/cultivos?q=&sol=&temporada=&zona=`, `/cultivos/$cultivoId`, `/bancales`, `/bancales/nuevo`, `/bancales/$bancalId/editar`, `/bancales/$bancalId?mes=5`.

## Reglas del dominio

Versioned record of domain decisions, confirmed with the user in T3 (2026-11-07). A new or changed rule is decided with the user and written here before any test encodes it.

- Grid: cells of 30 × 30 cm; columns = ⌊width / 30⌋, rows = ⌊length / 30⌋ (leftover cm are unused: 120 × 90 → 4 × 3, 100 × 50 → 3 × 1); one crop per cell.
- Bed: each side from **30 cm** (one cell) to **300 cm** (10 cells), in **whole centimetres**; sun hours 0–24, decimals allowed (2.5 h); name required, **at most 40 characters** (fits the list card and the editor header at 360 px).
- **Shrinking a bed** (decided in T8, 2026-11-07): saving a bed with smaller dimensions **removes the plantations left outside** the new grid; the edit form warns how many before saving (T12). The api rejects plantations outside the grid or two in the same cell.
- Corrupt `localStorage` (T8): the unreadable data are set aside under another key and the app starts empty and warns; when the user dismisses the warning, the set-aside copy is deleted.
- Neighbourhood = the **8 surrounding cells**, diagonals included (corner 3, edge 5, centre 8); compatibility between neighbours is favourable, unfavourable or neutral, and symmetric.
- Exposure: full sun **≥ 6 h**, partial shade **3 to < 6 h**, shade **< 3 h**; limits count upwards (6 h → pleno sol, 3 h → semisombra). A crop needing more sun than the bed has → warning.
- Climate zones: atlántica (default), mediterránea, interior; they set sowing and harvest windows.
- Sowing window (`siembra`) = **when the crop goes into the bed** (direct sowing or transplanting the seedling, whichever applies to that crop); the seedbed is out of scope. So «sembrada» means «already in the soil». (T4)
- Catalogue (T4): ~24 crops that **fit in one 30 × 30 cm cell** (one or more plants per cell); crops needing several cells (courgette, pumpkin, melon, artichoke, large cabbages) are left out — «plants spanning several cells» is a post-MVP iteration. Data come from existing, openable Spanish horticulture sources (calendars, sun, watering, companions) and the square-foot method (plants per cell); each source has a short id in `fuentes` and its full reference in the README.
- Plant state in a month: por sembrar → sembrada → creciendo → cosecha → **terminada** (after the harvest: the cell is free again, drawn as stubble), **derived, never stored**. Default sowing month = first valid month of its zone's sowing window.
- **Crop cycle** (decided in T4, **per zone since T18**, 2026-11-07): each crop has, **in each zone's calendar**, `calendario[zona].ciclo = { mesesHastaCosecha, mesesDeCosecha }` (whole months ≥ 1, total ≤ 12 so it fits the one-year slider), because crops grow at different speeds in each climate (overwintering is slower). The plantation uses the cycle of **its bed's zone**; with the default sowing month (C7.3), the first harvest month falls inside that zone's harvest window (C18.2). The state of a plantation is computed from **its own** `mesSiembra`: sembrada in that month, creciendo until `mesSiembra + mesesHastaCosecha`, cosecha for `mesesDeCosecha` months, then terminada. The zone **sowing** window drives the out-of-season warning; the zone **harvest** window is informative only (crop page). Counted in months from sowing (d = 0 in `mesSiembra`): sembrada at d = 0, creciendo for 1 ≤ d < `mesesHastaCosecha`, cosecha for the next `mesesDeCosecha` months (tomate sown in May {2,2}: creciendo June, cosecha July–August, terminada from September).
- **Year wrap** (decided in T7, 2026-11-07): the bed shows a **typical year that repeats**. A cycle that runs past December continues in January–… of the same slider (ajo sown in October is creciendo in January, as the sowing of the previous October). Months not covered by the cycle are **por sembrar** if they come before `mesSiembra` in the calendar year, **terminada** if after.
- **Catalogue filters** (decided in T9, 2026-11-07): `q` = name contains the text (ignoring case and accents); `sol` = the crop's sun need is exactly that exposure; `temporada` = a month 1–12: crops whose **sowing window in the chosen zone** contains it; `zona` = the zone for that window and for the sowing months shown in the list (atlántica if absent). Invalid values are ignored.
- **Tareas del mes** (T7): for a bed and a month, *sembrar* = crops of the plantations whose `mesSiembra` is that month; *cosechar* = crops of the plantations in cosecha that month; each crop listed once.
- Warnings (unfavourable neighbour, insufficient sun, out-of-season sowing) are **recommendations with an explanation, never blocks**. An unfavourable neighbourhood gives **one warning per pair of cells**, not one per side (C6.2); its explanation comes from the `motivo` stored in the crop's relation. `EstadoPlanta` and `Aviso` are discriminated unions.
- Every horticulture data point is verified against cited sources (agent `revisor-datos`); sources go in the README. This is the project's main risk of errors.

## How work is done (harness)

Per task in `docs/tareas.md`: mark it 🔄 → build it with the matching skill → verify with the **`verificador`** agent (skill `verify-task`) → for UI tasks also **`react-reviewer`** and **`design-reviewer`** → fix and re-verify until ✅ → update the task's **Verificación** line → one commit per task.

| Piece | Use it for |
|---|---|
| skill `plan-tasks` | adding, splitting or reordering tasks; turning an iteration into tasks |
| skill `tdd-core` | any function in `src/core/` (T3–T8) |
| skill `react-bancal` | any `.tsx`, hook, route or form (T1, T9–T15) |
| skill `react-testing` | component, container and hook tests |
| skill `frontend-a11y` | forms, the editor grid (roving tabindex), `aria-live` warnings, focus |
| skills `brief-grill` → `tailwind-design-system` | T2: visual direction into `docs/brief.md`, then `@theme` tokens |
| skills `design-taste-frontend`, `tailwind-clases-limpias`, `ux-copy` | building and polishing screens; UI copy in Spanish |
| skill `verify-task` | the verification procedure (gates, evidence per tag, report format) |
| agent `verificador` | runs `verify-task` with fresh eyes; has no edit tools |
| agent `react-reviewer` | read-only code review of React/TS against `react-bancal` |
| agent `design-reviewer` | read-only design review against `docs/brief.md`, walks the demo flow |
| agent `revisor-datos` | checks `crops.json` against real sources (criteria tagged `datos`) |

Hooks (`.claude/hooks/`, registered in `.claude/settings.json`) — expect them:

- `test-primero` blocks **creating** a module in `src/core/` without its `.test.ts` next to it (except `index.ts`, `model.ts`, `*.d.ts` and anything under `__fixtures__/`).
- `guardia-irreversible` blocks `git push --force`, `git reset --hard`, `git clean -f`, recursive deletes of the root/home/`.git`, secrets files and edits to `src/routeTree.gen.ts`; asks before writing outside the repo.
- `tarea-en-curso` (SessionStart, also after `/compact`) injects the 🔄 task from `docs/tareas.md` (else the first ❌, else the first ⬜) plus uncommitted files. Task state lives only in `tareas.md`; if a task outlives a session, add a short **Notas:** line to it (decisions, blockers) and fold it into **Verificación** when it closes.
- `verificar-al-parar` (Stop) won't let the session stop while (a) any ✅ task in `docs/tareas.md` has an empty **Verificación** line — always checked — or (b) build-relevant files have uncommitted changes and `check-estatico` (`[FALLA]` only), `npm test`, `vite build` (to a temp dir) or `tsc --noEmit` fail.

Browser checks use the Playwright MCP from `.mcp.json` (pinned `@playwright/mcp`); Lighthouse runs via `npx`. The user-level `ecc` plugin is disabled for this project (`enabledPlugins`); its useful React pieces were copied and adapted into the skills above.

## Quality bar

- `npm run build` and the tests pass with no errors; no `only`/`skip`; tests are never weakened to go green.
- Fully keyboard-usable, visible focus, labelled fields, warnings announced with `aria-live`; **compatibility is never conveyed by colour alone** (colour + icon + text).
- Responsive from 360 px to desktop; UI in Spanish (`<html lang="es">`).
- README documents how to run, route map, screenshots, data sources and an AI-usage log.

## Working with this user

- Give exactly what is asked; don't create unrequested documents or artifacts. When proposing ideas, be bold rather than obvious.
- Harness decisions (skills, agents, hooks) are made together with the user.
- Use the PowerShell tool for shell commands.
