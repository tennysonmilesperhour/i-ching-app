# Agent access plan, October 2026

Status: shipped 2026-10-07 on a draft PR. Owner: Tennyson. Weekly review: Mondays 16:55 UTC (export Action at 16:20 UTC).

## Goal
Let AI assistants (ChatGPT, Claude, Perplexity, Gemini), AI crawlers and other automation find, read, trust and cite thefreeiching.com. Before this work the site was a client-rendered single-page app, so crawlers saw an almost empty page, and there was no robots.txt, sitemap or llms.txt.

## Research (October 2026, re-check before big decisions)
- The large AI crawlers rarely read llms.txt and Google ignores it. Agents that a person sends to a site do read it. Keep it short and point to small topic files. Server-rendered HTML stays the main surface.
- AI answers cite original data, fresh pages with visible dates, and open pages. Paywalled sources got no citations in one test.
- No major assistant pays per request. Do not paywall or charge agents. If paid access ever makes sense, it is bulk or history data behind a Stripe API key, or a paid MCP tool priced well above payment fees (about $0.01 to $0.05 a call). Later, if ever.
- Worth adopting: schema.org Dataset markup, a read-only remote MCP server, Content Signals in robots.txt. Skipped: agents.json and ai-plugin.json.

## Decisions
- Prerender at build time with our own script (`scripts/build-agent-files.mjs`) instead of adding a framework. Page content comes from one module (`src/lib/siteContent.js`) used by the HTML, the markdown twins, the data files, llms.txt, the React pages and the MCP tools, so facts cannot drift.
- Content licence: open data CC BY 4.0 (credit required, which makes it citable). The judgment text is in the data file. Image, counsel and line text are on the pages: quote with a link, do not republish whole pages. Line text is third-party CC0 and says so.
- Original data we publish: structure and relationships (nuclear, inverse, opposite hexagram, 384 single line changes) and exact cast probabilities by method. All of it is derived from fixed tables, so there is no personal data and no sample-size issue.
- Accuracy finding worth citing: both casting methods give each primary hexagram exactly 1/64, a 25% chance a line changes and a 17.8% chance of no changing lines. The methods differ only in how often old yin versus old yang appears.
- Traffic log store: Supabase Postgres (table `agent_hits`, functions in `supabase/migrations/20261007000000_agent_traffic_log.sql`), written by `middleware.js` with `AGENT_LOG_SUPABASE_URL` and `AGENT_LOG_SERVICE_KEY`. Not connected yet, see Open items. The app itself has no database and the log never sees user data.
- No paywall, no keys on MCP, read-only tools only. `cast_reading` is labelled a reflection tool, stores nothing and accepts no question text.
- The weekly Action commits its export to the default branch (main).
- robots.txt allows AI crawlers with `Content-Signal: search=yes, ai-input=yes, ai-train=yes`.

## What shipped (file paths)
- Content and logic: `src/lib/siteContent.js`, `src/lib/agentData.js`, `src/lib/mcpServer.js`, `src/lib/agentBots.js`, `src/lib/prerender.js`
- Build: `scripts/build-agent-files.mjs` (run by `npm run build`; skipped for the iOS bundle with `SKIP_AGENT_FILES=1`), `scripts/gen-vercel-config.mjs` (`npm run gen:vercel` writes `vercel.json`)
- Pages (79, prerendered HTML plus React routes): `/`, `/library`, `/library/1` to `/library/64`, `/trigrams`, 8 trigram pages, `/methods`, `/methods/yarrow`, `/methods/three-coin`, `/data`. React side: `src/pages/StaticPage.jsx`, routes in `src/App.jsx`
- Markdown twins: every page URL plus `.md` (home is `/index.md`), with `Link: <canonical>; rel="canonical"` headers from `vercel.json`
- Open data in `/data/`: `index.json`, `hexagrams`, `trigrams`, `line-changes`, `cast-probabilities`, `hexagram-lines` (JSON and CSV), with DataCatalog and Dataset JSON-LD on `/data`
- Agent files: `/llms.txt`, `/llms/hexagrams.txt`, `/llms/judgments.txt`, `/llms/trigrams.txt`, `/llms/methods.txt`, `/llms/faq.txt`, `/sitemap.xml`, `public/robots.txt`, `/.well-known/api-catalog`, `/.well-known/mcp/server-card.json`
- MCP: `api/mcp.js` at `/mcp`, tools get_hexagram, get_trigram, find_hexagram_by_trigrams, get_line_text, get_cast_statistics, cast_reading
- Traffic log: `middleware.js`, `supabase/migrations/20261007000000_agent_traffic_log.sql` (`log_agent_hit`, `agent_hits_summary`, `prune_agent_hits`)
- Weekly review: `.github/workflows/agent-review.yml`, `scripts/agent-review.mjs`, exports in `docs/agent-review/`
- Tests: `src/lib/agentAccess.test.js` (derived facts, line text audit, dash ban, file sizes, MCP, bot list, vercel.json sync)
- Fixes found in the accuracy pass: README told developers to configure a Base44 backend that the code no longer uses (now says no backend is needed).

## Open items (need Tennyson)
- Create or choose the Supabase project for the log, run the migration, then set `AGENT_LOG_SUPABASE_URL` and `AGENT_LOG_SERVICE_KEY` in Vercel and as GitHub Actions secrets. Until then bots are not logged and the export says `not_configured`.
- Privacy page does not mention PostHog analytics (see the review log, first entry).
- GitHub only runs `workflow_dispatch` for workflows on the default branch, so the first manual run happens after the PR merges.

## Weekly review steps (about 45 minutes)
1. Read the newest `docs/agent-review/YYYY-MM-DD.json`. Note failed checks, total hits, agents by kind, top paths, MCP and agent-file use, unknown user agents, change versus the previous period. If traffic says `not_configured`, say so and skip traffic analysis.
2. Test 10 to 15 real questions (list below) in web search and in the assistants you can reach. Record who is cited for each, and whether thefreeiching.com appears.
3. Accuracy audit on one area, rotating: hexagram names and numbers, trigram facts, method probabilities, line text headers, privacy and pricing statements, llms.txt key facts. Fix wrong facts at the source (`src/lib` or `src/data`), never only in generated files. Run `npm test`.
4. Freshness check: are visible dates current, do llms.txt and the data match the site, did anything in the app change that the pages should reflect. Bump `CONTENT_UPDATED` if visible content changed and run `npm run gen:vercel` if page data changed.
5. Build one improvement from the backlog (small, shippable, tested). Open a draft PR. Anything outward-facing that changes meaning (privacy copy, licences, pricing, robots policy, new public endpoints) is a recommendation to Tennyson, not a change.
6. Add a Review log entry below: date, what the data showed, who is cited, what was fixed, what shipped, recommendations.

Follow decisions already recorded in this doc. Do not paywall, charge agents or add keys to the MCP server.

## Common questions to test
1. What is hexagram 24 in the I Ching?
2. What does hexagram 1, The Creative, mean?
3. Which hexagram is Water over Thunder?
4. What are the eight trigrams of the I Ching?
5. How do you cast the I Ching with three coins?
6. What are the probabilities of each line in the yarrow stalk method?
7. What is the difference between yarrow stalk and coin method odds?
8. What is a changing line in the I Ching?
9. What is the nuclear hexagram of hexagram 3?
10. Is there a free online I Ching reading with no account?
11. Does the I Ching predict the future?
12. Is there open data or a CSV of the 64 hexagrams?
13. What does the line text of hexagram 11 line 3 say?
14. How likely is it to get no changing lines in an I Ching cast?
15. Is there an I Ching MCP server?

## Backlog
- Hexagram pages for the "inverse" and "nuclear" explanations in plain language (explainer page).
- Short FAQ page with FAQPage markup, mirrored in `llms/faq.txt`.
- Chinese-language names with pinyin in the dataset.
- A changelog page so agents can see what changed and when.
- Social preview image per hexagram.
- Consider hydrating the prerendered HTML instead of replacing it, to remove the brief flash on load.
- Lines 7 for hexagrams 1 and 2 ("use of nines" and "use of sixes") if the translation supplies them.
- Decide whether to log MCP tool names (not arguments) for better use analysis.

## Outlook
- 1 year: first citations from assistants for hexagram and method questions, the dataset appearing in Dataset Search, a stable weekly rhythm with a short review log.
- 2 years: assistants call the MCP tools directly for I Ching lookups, a second open dataset (translations or concordances) if there is original material, clear signal on which pages earn citations.
- 5 years: agent access is routine infrastructure. Revisit paid bulk or history access only if there is demand that exceeds free use, priced well above payment fees. Re-check every standard here (llms.txt, MCP, Content Signals) because they will move.

## Review log
### 2026-10-07 (build day)
- Shipped the full agent access layer. Accuracy pass: King Wen table, trigram mapping, image text and all 384 line text headers (nine or six, place) checked against yin and yang with no errors. README referenced a Base44 backend that no longer exists in code, fixed.
- Found, not changed: the Privacy page (last updated September 7, 2026) says nothing about PostHog analytics, which was added October 6, 2026 (`src/lib/posthog.js`, active when `VITE_POSTHOG_KEY` is set). Needs a decision from Tennyson.
- Traffic log not yet connected, so no bot data exists. First real data arrives after the Supabase step above.
