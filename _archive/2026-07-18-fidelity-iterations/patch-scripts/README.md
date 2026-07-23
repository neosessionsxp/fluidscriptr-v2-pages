# FluidScriptr — Conversion Fidelity Analysis

This is the "does the screenplay stay true to the book" feature — scene-diff
scoring on top of your existing manuscript-to-screenplay conversion. Same
architecture pattern as MAT (structured Claude call → JSON → derived scores
→ free preview / full unlock), pointed at a new rubric.

## Files

- `prompts.js` — the two prompt templates (structural+omission extraction,
  dialogue extraction). Both force strict JSON output.
- `scoring.js` — pure JS functions that turn the extracted JSON into five
  1-10 scores. No API calls here — this is what makes a score defensible:
  you can always point to the exact omissions/mappings behind a number.
- `fidelity-route.js` — two Express routes (`/api/fidelity-analysis`,
  `/api/fidelity-unlock`) ready to mount on your existing app.
- `test-fidelity.js` — local harness to validate prompt output before
  wiring anything into production.

Both `prompts.js` and `scoring.js` have been syntax-checked and
`scoring.js` has been run against mock extraction data — the formulas
produce sane, non-crashing 1-10 output. The prompts themselves haven't
been tested against a real Claude call yet (needs your API key) — that's
step 1 below.

## The five scores

| Score | What it measures | How it's derived |
|---|---|---|
| Structural Fidelity | Did act structure carry over, or get reorganized? | Formula on the mapping relationships |
| Scene Retention | % of manuscript units that survived in any form | Formula on mapping vs. manuscript structure |
| Omission Impact | How much do the *cut* elements matter? | Weighted penalty by classification (load-bearing/moderate/cosmetic) |
| Dialogue Transformation | Verbatim vs. rewritten vs. invented dialogue | % distribution across categories |
| Pacing Shift | Did the acts' relative weight change? | Divergence between manuscript/screenplay act-share |

Structural Fidelity, Scene Retention, and Pacing Shift are close to
mechanical measurement — the hardest part to fake, and the strongest
"proprietary" claim if you ever need one. Omission Impact and Dialogue
Transformation involve real judgment calls from Claude, which is why
those prompts extract-then-classify rather than asking for a score directly.

## Step 1 — Test the prompts locally

```bash
cd fluidscriptr-fidelity
npm init -y   # if this folder isn't already part of a Node project
```

Open `test-fidelity.js` and paste in:
- A real manuscript excerpt (a chapter or two is plenty)
- Its actual FluidScriptr-generated screenplay conversion

Then run:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here node test-fidelity.js
```

Read the output. Specifically check:
- Do the `omissions` classifications feel right? (Would *you* call that
  subplot "load_bearing"?)
- Do the `dialogue_pairs` categories look correct? (Is something marked
  "verbatim" actually verbatim?)

Run it 2-3 times on the same pair. Some drift is normal, but if
classifications flip wildly between runs, tighten the prompt — the
easiest fix is adding one worked example directly in the system prompt
showing what a "load_bearing" vs. "cosmetic" omission looks like.

## Step 2 — Wire into server.js

In your existing `server.js`:

```js
const { registerFidelityRoutes } = require("./fluidscriptr-fidelity/fidelity-route");

// ... after your existing app setup, alongside your other route registrations
registerFidelityRoutes(app);
```

Two things to adapt in `fidelity-route.js` before this goes live:

1. **API key sourcing.** The route currently expects `apiKey` in the
   request body, matching FluidScriptr's BYOK model. If your existing
   conversion endpoint sources the key differently (e.g. from a stored
   session or a different field name), match that pattern instead.

2. **Unlock gating** (marked `TODO` in the file). MAT gates its unlock on
   a $15 PayPal payment per report. Since this feature should be
   *bundled* into the founding-member tier rather than sold separately
   (see the pricing discussion — charging extra to find out if the
   conversion did a good job undercuts the trust the feature is meant to
   build), swap that TODO for whatever check already confirms a user has
   founding-member/paid access to FluidScriptr itself.

## Step 3 — Frontend

The free-preview response shape (`overall`, `scores`, `verdict`, `token`)
is designed to slot into a UI section similar to MAT's preview card —
five labeled scores plus the one-line verdict. The unlock response adds
`mapping`, `omissions`, and `dialoguePairs` — this is the data for the
actual scene-by-scene diff view. Rendering that diff (side-by-side or
timeline) is a separate frontend task once the data's flowing correctly.

## Step 4 — Cost note

This adds two Claude API calls per conversion (structural+omission, then
dialogue). Since FluidScriptr is BYOK, this runs on the user's own key —
no additional cost to you. Worth mentioning in the founding-member copy
alongside the feature itself ("included with your own API key, no extra
charge") since some users may wonder why a bundled feature doesn't cost
extra.

## What's NOT done yet

- No real Claude API call has been tested (needs your key — see Step 1)
- Frontend/UI for displaying the scores and diff
- Persisting tokens to Supabase instead of in-memory (same known
  limitation MAT already has — fine to defer for now)
- The qualitative "does this dialogue balance suit the genre" note
  mentioned in the original design — not in the JSON schema yet; add a
  free-text field to the dialogue prompt if you want it included
