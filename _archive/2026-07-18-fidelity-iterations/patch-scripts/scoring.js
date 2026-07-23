// scoring.js
// Pure functions — NO API calls happen here. Takes the two extraction
// JSON payloads (from the prompts.js calls) and derives the five 1-10
// fidelity scores by formula, not by asking Claude for a number directly.
// This is what makes the scores reproducible and defensible: if an author
// disputes a 6, you can point to the exact omissions/mappings that produced it.

function clamp(n, min = 1, max = 10) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

// Shared helper: manuscript units marked "out_of_scope" were never meant to
// be adapted (e.g. a Short Film only drawing from one chapter of a full
// manuscript). They should not count against any score below — filter them
// out before computing anything structural.
function inScopeMapping(mapping) {
  return mapping.filter((m) => m.relationship !== "out_of_scope");
}

function inScopeManuscriptStructure(manuscriptStructure, mapping) {
  const outOfScopeIds = new Set(
    mapping.filter((m) => m.relationship === "out_of_scope").map((m) => m.manuscript_id)
  );
  return manuscriptStructure.filter((unit) => !outOfScopeIds.has(unit.id));
}

// 1. Structural Fidelity
// Penalizes reordering/merging/splitting relative to a clean "adapted" mapping.
// Omission is NOT penalized here — that's Scene Retention's job, to avoid
// double-counting the same fact against two different scores. out_of_scope
// units are excluded entirely — they were never meant to be adapted, so they
// carry no fidelity signal one way or the other.
function scoreStructuralFidelity(mapping) {
  const scoped = inScopeMapping(mapping);
  if (!scoped.length) return 1;
  const penalties = { adapted: 0, expanded: 0.25, merged: 0.75, split: 1, omitted: 0 };
  let score = 10;
  for (const m of scoped) {
    score -= penalties[m.relationship] ?? 0.5;
  }
  return clamp(score);
}

// 2. Scene Retention Rate
// % of IN-SCOPE manuscript units that have at least one non-"omitted" mapping.
// out_of_scope units are excluded from both numerator and denominator — a
// Short Film that only ever intended to adapt one chapter shouldn't be
// penalized for not including the other nine.
function scoreSceneRetention(manuscriptStructure, mapping) {
  const scopedUnits = inScopeManuscriptStructure(manuscriptStructure, mapping);
  if (!scopedUnits.length) return 1;
  const retained = scopedUnits.filter((unit) => {
    const m = mapping.find((x) => x.manuscript_id === unit.id);
    return m && m.relationship !== "omitted";
  }).length;
  const pct = retained / scopedUnits.length;
  return clamp(pct * 10);
}

// 3. Omission Impact
// Uses AVERAGE severity per omission, not a running sum. A memoir or dense
// novel will naturally generate dozens of omissions just from being
// compressed into screenplay length — that volume is normal, not automatically
// bad. What should drive the score is how load-bearing the average omission
// is, not how many there are.
function scoreOmissionImpact(omissions) {
  if (!omissions.length) return 10;
  const weights = { load_bearing: 3, moderate: 1, cosmetic: 0.25 };
  const totalWeight = omissions.reduce((sum, o) => sum + (weights[o.classification] ?? 0.5), 0);
  const avgWeight = totalWeight / omissions.length; // ranges 0 (all cosmetic) to 3 (all load-bearing)
  const score = 10 - (avgWeight / 3) * 9; // map average severity onto the 1-10 scale
  return clamp(score);
}

// 4. Dialogue Transformation
// Not a "good/bad" score — describes where on the verbatim <-> invented
// spectrum the adaptation landed. Since dialoguePairs is now a SAMPLE
// (~20-30 exchanges, not exhaustive), we compute the transformation RATE
// from that sample and scale it up to estimatedTotalMatchedExchanges (the
// full-excerpt estimate), then blend in the screenplay-only invented lines,
// which are counted exhaustively, not sampled.
function scoreDialogueTransformation(dialoguePairs, screenplayOnlyLinesCount = 0, estimatedTotalMatchedExchanges = null) {
  const sampleSize = dialoguePairs.length;
  const totalMatched = estimatedTotalMatchedExchanges != null && estimatedTotalMatchedExchanges > 0
    ? estimatedTotalMatchedExchanges
    : sampleSize; // fallback if the model didn't provide an estimate

  const totalDialogueUnits = totalMatched + screenplayOnlyLinesCount;
  if (!totalDialogueUnits) return 5; // neutral default if there's nothing to compare

  const counts = { verbatim: 0, lightly_edited: 0, rewritten: 0, invented: 0 };
  for (const p of dialoguePairs) counts[p.category] = (counts[p.category] || 0) + 1;
  const sampleTransformedRate = sampleSize ? (counts.rewritten + counts.invented) / sampleSize : 0;

  const transformedFromMatched = sampleTransformedRate * totalMatched;
  const transformedTotal = transformedFromMatched + screenplayOnlyLinesCount;
  const transformedPct = transformedTotal / totalDialogueUnits;
  return clamp(transformedPct * 10);
}

// 5. Pacing Shift
// Heuristic: compare each act's share of manuscript units vs its share of
// screenplay scenes. Large divergence = pacing shifted between acts.
// Higher score = more stable/consistent pacing across the adaptation.
// out_of_scope manuscript units are excluded — comparing pacing against
// material the screenplay was never adapting would be meaningless.
function scorePacingShift(manuscriptStructure, screenplayStructure, mapping = []) {
  const scopedManuscript = mapping.length
    ? inScopeManuscriptStructure(manuscriptStructure, mapping)
    : manuscriptStructure;
  const actShare = (structureArr) => {
    const counts = { 1: 0, 2: 0, 3: 0 };
    for (const u of structureArr) counts[u.act] = (counts[u.act] || 0) + 1;
    const total = structureArr.length || 1;
    return { 1: counts[1] / total, 2: counts[2] / total, 3: counts[3] / total };
  };
  const mShare = actShare(scopedManuscript);
  const sShare = actShare(screenplayStructure);
  const divergence = [1, 2, 3].reduce((sum, act) => sum + Math.abs(mShare[act] - sShare[act]), 0);
  // divergence ranges 0 (identical pacing) to 2 (max possible divergence)
  const score = 10 - (divergence / 2) * 9;
  return clamp(score);
}

function computeFidelityScores(structuralOmissionResult, dialogueResult) {
  const { manuscript_structure, screenplay_structure, mapping, omissions } = structuralOmissionResult;
  const { dialogue_pairs, screenplay_only_lines_count, estimated_total_matched_exchanges } = dialogueResult;

  return {
    structuralFidelity: scoreStructuralFidelity(mapping),
    sceneRetention: scoreSceneRetention(manuscript_structure, mapping),
    omissionImpact: scoreOmissionImpact(omissions),
    dialogueTransformation: scoreDialogueTransformation(
      dialogue_pairs,
      screenplay_only_lines_count || 0,
      estimated_total_matched_exchanges
    ),
    pacingShift: scorePacingShift(manuscript_structure, screenplay_structure, mapping),
  };
}

module.exports = { computeFidelityScores };
