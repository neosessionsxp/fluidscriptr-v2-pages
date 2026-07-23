// fidelity-route.js
// Drop-in Express route for FluidScriptr's Conversion Fidelity Analysis.
// Mirrors the MAT pattern you already have working: free preview (scores +
// verdict) issued with a one-time token, full report (diff + reasoning)
// returned on unlock.
//
// IMPORTANT: since this feature is meant to be BUNDLED into the founding-
// member tier (not sold per-report like MAT's $15 unlock), the unlock
// endpoint below should check your existing founding-member/paid-access
// flag rather than a PayPal transaction. That's marked with a TODO below —
// swap in whatever check FluidScriptr already uses to gate premium features.

const crypto = require("crypto");
const { buildStructuralAndOmissionPrompt, buildDialoguePrompt } = require("./prompts");
const { computeFidelityScores } = require("./scoring");

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// In-memory token store — same known limitation as MAT (resets on Railway
// restart). Fine to start; same future fix applies if it matters later
// (persist to Supabase alongside everything else).
const fidelityTokens = new Map();

// Pulls the JSON object out of a response even if Claude added a stray
// sentence of commentary before or after it. Finds the first "{" and the
// matching last "}" and parses just that slice.
function extractJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in response:\n" + text);
  }
  return JSON.parse(text.slice(start, end + 1));
}

async function callClaude(apiKey, system, user) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();

  if (data.error) {
    throw new Error("Anthropic API error: " + JSON.stringify(data.error));
  }

  if (data.stop_reason === "max_tokens") {
    throw new Error(
      "Response got cut off before finishing (hit the max_tokens limit). " +
      "Consider chunking longer manuscripts, or raise max_tokens further."
    );
  }

  const text = data.content?.map((b) => b.text || "").join("") || "";
  return extractJSON(text);
}

function registerFidelityRoutes(app) {
  // Run the analysis. Since FluidScriptr is BYOK, expect the user's own
  // Anthropic key to be available server-side for this request the same
  // way it already is for the conversion step — adjust apiKey sourcing
  // below to match however server.js currently reads it.
  app.post("/api/fidelity-analysis", async (req, res) => {
    try {
      const { manuscriptText, screenplayText, email, apiKey, conversionSettings } = req.body;

      if (!manuscriptText || !screenplayText || !email || !apiKey) {
        return res.status(400).json({
          error: "manuscriptText, screenplayText, email, and apiKey are required.",
        });
      }

      // conversionSettings should mirror whatever FluidScriptr's conversion
      // form captured: { targetFormat, adaptationApproach, tone, dialogueStyle }.
      // Passing this through lets the analysis judge omissions against what
      // the conversion was actually trying to do, rather than assuming a
      // full faithful feature-length adaptation every time.
      const structPrompt = buildStructuralAndOmissionPrompt(manuscriptText, screenplayText, conversionSettings);
      const structuralOmissionResult = await callClaude(apiKey, structPrompt.system, structPrompt.user);

      const dialoguePrompt = buildDialoguePrompt(manuscriptText, screenplayText, conversionSettings);
      const dialogueResult = await callClaude(apiKey, dialoguePrompt.system, dialoguePrompt.user);

      const scores = computeFidelityScores(structuralOmissionResult, dialogueResult);

      const overall = Math.round(
        (scores.structuralFidelity +
          scores.sceneRetention +
          scores.omissionImpact +
          scores.dialogueTransformation +
          scores.pacingShift) /
          5
      );

      const token = crypto.randomBytes(16).toString("hex");
      fidelityTokens.set(token, {
        email,
        structuralOmissionResult,
        dialogueResult,
        scores,
        createdAt: Date.now(),
      });

      // Free preview: scores + one-line verdict only, no diff detail yet.
      res.json({
        token,
        overall,
        scores,
        verdict:
          overall >= 8
            ? "High-fidelity adaptation — the screenplay closely tracks the source material."
            : overall >= 5
            ? "Moderate transformation — meaningful changes were made in the adaptation."
            : "Significant transformation — the screenplay departs substantially from the manuscript.",
      });
    } catch (err) {
      console.error("Fidelity analysis error:", err);
      res.status(500).json({ error: "Failed to run fidelity analysis." });
    }
  });

  // Unlock the full report: scene-by-scene mapping, omissions list with
  // reasons, and dialogue pair breakdown.
  app.post("/api/fidelity-unlock", async (req, res) => {
    try {
      const { token, email } = req.body;
      const record = fidelityTokens.get(token);

      if (!record) return res.status(404).json({ error: "Token not found or expired." });
      if (record.email !== email) return res.status(403).json({ error: "Email does not match this report." });

      // TODO: replace this with FluidScriptr's actual founding-member /
      // paid-access check (however server.js currently confirms the user
      // has an active account), since this feature is bundled rather than
      // sold per-report the way MAT's PayPal unlock works.

      const { structuralOmissionResult, dialogueResult, scores } = record;
      fidelityTokens.delete(token); // one-time use, same pattern as MAT

      res.json({
        scores,
        mapping: structuralOmissionResult.mapping,
        omissions: structuralOmissionResult.omissions,
        dialoguePairs: dialogueResult.dialogue_pairs,
      });
    } catch (err) {
      console.error("Fidelity unlock error:", err);
      res.status(500).json({ error: "Failed to unlock fidelity report." });
    }
  });
}

module.exports = { registerFidelityRoutes };
