#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════
// FluidScriptr Fidelity Patch v2 — fixes JSON truncation on full manuscripts
//
// Problem: the structural/omissions prompt tried to list EVERY omission
// exhaustively. For a 70-page test excerpt that's fine; for a real
// full-length manuscript, the omissions list (plus chapter structure) can
// blow past the 8000-token response limit, cutting the JSON off mid-array.
//
// Fix: sample the most significant omissions (like the dialogue check
// already does) and add aggregate counts per classification so the score
// stays accurate even from a sample, instead of trying to list everything.
//
// This patch only touches 4 small, precise spots inside the fidelity code
// you already added — nothing else in your file is touched.
//
// Usage:
//   node apply-fidelity-patch-v2.js /path/to/FluidScriptr-App.html
// ══════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('❌ Usage: node apply-fidelity-patch-v2.js /path/to/FluidScriptr-App.html');
  process.exit(1);
}
if (!fs.existsSync(inputPath)) {
  console.error('❌ Could not find file at: ' + inputPath);
  process.exit(1);
}

const original = fs.readFileSync(inputPath, 'utf8');

// ── Anchor 1: the omissions instruction paragraph in the structural prompt ──
const anchor1 = `4. A list of manuscript elements that do NOT appear in the screenplay at all: subplots, character beats, thematic threads, minor characters, world/setting details. For each, classify narrative importance IN LIGHT OF THE CONVERSION CONTEXT ABOVE:
   - "load_bearing": removing it changes the story's meaning or a character's motivation, even accounting for the chosen format and approach
   - "moderate": noticeable but not structurally critical
   - "cosmetic": detail-level, low impact if cut
   Give a one-sentence reason for each classification.

Keep every "summary" field to one short sentence, under 15 words. This keeps the response a manageable size for longer manuscripts.`;

const replacement1 = `4. A list of manuscript elements that do NOT appear in the screenplay at all: subplots, character beats, thematic threads, minor characters, world/setting details. For each, classify narrative importance IN LIGHT OF THE CONVERSION CONTEXT ABOVE:
   - "load_bearing": removing it changes the story's meaning or a character's motivation, even accounting for the chosen format and approach
   - "moderate": noticeable but not structurally critical
   - "cosmetic": detail-level, low impact if cut
   Give a one-sentence reason for each classification.

IMPORTANT for full-length manuscripts — keep the response compact:
   A long manuscript will naturally have far more omissions than can be usefully listed. In "omissions", list at most the 20 MOST SIGNIFICANT ones (prioritize load_bearing and moderate; include only a few cosmetic examples if there's room) — do NOT try to catalog every omission exhaustively.
   Separately, in "omission_counts", give your best estimate of the TOTAL count in each classification across the WHOLE manuscript (not just the sampled list above) — this is what the fidelity score is actually calculated from, so it must reflect the full manuscript even though the list itself is a sample.

Keep every "summary" field to one short sentence, under 15 words. This keeps the response a manageable size for longer manuscripts.`;

// ── Anchor 2: the JSON schema line for omissions ──
const anchor2 = `  "omissions": [{"element": "string", "type": "subplot|character_beat|theme|minor_character|setting_detail", "description": "string", "classification": "load_bearing|moderate|cosmetic", "reason": "string"}]
}\`;`;

const replacement2 = `  "omissions": [{"element": "string", "type": "subplot|character_beat|theme|minor_character|setting_detail", "description": "string", "classification": "load_bearing|moderate|cosmetic", "reason": "string"}],
  "omission_counts": {"load_bearing": 0, "moderate": 0, "cosmetic": 0}
}\`;`;

// ── Anchor 3: scoreOmissionImpact function ──
const anchor3 = `function scoreOmissionImpact(omissions) {
  if (!omissions.length) return 10;
  const weights = { load_bearing: 3, moderate: 1, cosmetic: 0.25 };
  const totalWeight = omissions.reduce((sum, o) => sum + (weights[o.classification] ?? 0.5), 0);
  const avgWeight = totalWeight / omissions.length;
  return fidelityClamp(10 - (avgWeight / 3) * 9);
}`;

const replacement3 = `function scoreOmissionImpact(omissions, omissionCounts) {
  const weights = { load_bearing: 3, moderate: 1, cosmetic: 0.25 };
  let totalWeight = 0, totalCount = 0;
  // Prefer the full-manuscript aggregate counts (accurate for long manuscripts
  // where the omissions array itself is only a representative sample).
  if (omissionCounts && ((omissionCounts.load_bearing || 0) + (omissionCounts.moderate || 0) + (omissionCounts.cosmetic || 0) > 0)) {
    totalCount = (omissionCounts.load_bearing || 0) + (omissionCounts.moderate || 0) + (omissionCounts.cosmetic || 0);
    totalWeight = (omissionCounts.load_bearing || 0) * 3 + (omissionCounts.moderate || 0) * 1 + (omissionCounts.cosmetic || 0) * 0.25;
  } else if (omissions && omissions.length) {
    totalCount = omissions.length;
    totalWeight = omissions.reduce((sum, o) => sum + (weights[o.classification] ?? 0.5), 0);
  }
  if (!totalCount) return 10;
  const avgWeight = totalWeight / totalCount;
  return fidelityClamp(10 - (avgWeight / 3) * 9);
}`;

// ── Anchor 4: computeFidelityScores destructure + call site ──
const anchor4 = `function computeFidelityScores(structuralResult, dialogueResult) {
  const { manuscript_structure, screenplay_structure, mapping, omissions } = structuralResult;
  const { dialogue_pairs, screenplay_only_lines_count, estimated_total_matched_exchanges } = dialogueResult;
  return {
    structuralFidelity: scoreStructuralFidelity(mapping),
    sceneRetention: scoreSceneRetention(manuscript_structure, mapping),
    omissionImpact: scoreOmissionImpact(omissions),
    dialogueTransformation: scoreDialogueTransformation(dialogue_pairs, screenplay_only_lines_count, estimated_total_matched_exchanges),
    pacingShift: scorePacingShift(manuscript_structure, screenplay_structure, mapping),
  };
}`;

const replacement4 = `function computeFidelityScores(structuralResult, dialogueResult) {
  const { manuscript_structure, screenplay_structure, mapping, omissions, omission_counts } = structuralResult;
  const { dialogue_pairs, screenplay_only_lines_count, estimated_total_matched_exchanges } = dialogueResult;
  return {
    structuralFidelity: scoreStructuralFidelity(mapping),
    sceneRetention: scoreSceneRetention(manuscript_structure, mapping),
    omissionImpact: scoreOmissionImpact(omissions, omission_counts),
    dialogueTransformation: scoreDialogueTransformation(dialogue_pairs, screenplay_only_lines_count, estimated_total_matched_exchanges),
    pacingShift: scorePacingShift(manuscript_structure, screenplay_structure, mapping),
  };
}`;

const anchors = [
  ['anchor1 (omissions instruction)', anchor1, replacement1],
  ['anchor2 (JSON schema)', anchor2, replacement2],
  ['anchor3 (scoreOmissionImpact)', anchor3, replacement3],
  ['anchor4 (computeFidelityScores)', anchor4, replacement4],
];

console.log('Checking anchors in your file...');
let allGood = true;
for (const [name, anchor] of anchors) {
  const count = original.split(anchor).length - 1;
  console.log('  ' + name + ': found ' + count + ' time(s) (expected: 1)');
  if (count !== 1) allGood = false;
}

if (!allGood) {
  console.error('');
  console.error('❌ STOPPING — one or more anchors did not match exactly once.');
  console.error('   Nothing was written. Send this output back for a corrected patch.');
  process.exit(1);
}

let patched = original;
for (const [, anchor, replacement] of anchors) {
  patched = patched.replace(anchor, replacement);
}

const outputPath = inputPath.replace(/\.html$/i, '') + '.v2.html';
fs.writeFileSync(outputPath, patched, 'utf8');

console.log('');
console.log('✅ Patch v2 applied successfully.');
console.log('   New file written to: ' + outputPath);
console.log('   Your input file was NOT modified.');
console.log('');
console.log('Next: test the fidelity check again on a real full-length conversion');
console.log('using ' + path.basename(outputPath) + ' — the omissions list should no');
console.log('longer cause a JSON truncation error.');
