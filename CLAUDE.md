# The Free I Ching: project rules

Live site: https://thefreeiching.com. Vite + React single-page app on Vercel, Capacitor iOS build. There is no application server: readings, questions, journal entries and sign-in live in the user's browser or device (`src/api/base44Client.js` is localStorage only).

## Rules
- Writing style: never use em dashes or en dashes in app copy, docs, generated files or data. Use commas, colons, periods or parentheses. A test enforces this for generated output.
- Never imply a reading predicts the future. The I Ching here is a reflection tool. Keep that notice on agent-facing output.
- Do not touch user data: journal entries, readings, local storage keys. Agent features must never read or log them.
- Content provenance: `src/lib/hexagramInterpretations.js` is original (judgment, image, counsel). `src/data/classicalLines.json` is CC0 from jesshewitt/i-ching, credited in `THIRD_PARTY_TEXT.md`.
- Branch: develop on the branch you are given and open a draft PR. The weekly export Action commits to the default branch.
- Checks before pushing: `npm test`, `npm run lint`, `npm run build`.

## Agent access layer
Everything bots and assistants read comes from one module, `src/lib/siteContent.js`, so facts cannot drift between HTML, markdown, data and MCP. Plan, decisions, weekly review steps and the review log: `docs/planning/agent-access-2026-10.md`.

After changing hexagram or page data, run `npm run gen:vercel` (a test fails if `vercel.json` is stale) and bump `CONTENT_UPDATED` in `src/lib/siteContent.js` when visible content changes.

## Decisions
- 2026-10-07: Agent access layer shipped (prerendered pages, markdown twins, open data CC BY 4.0, llms.txt, read-only MCP at /mcp, bot log, weekly review). See the plan doc.
