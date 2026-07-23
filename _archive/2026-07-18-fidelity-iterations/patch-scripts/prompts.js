// prompts.js
// Prompt builders for FluidScriptr's Conversion Fidelity Analysis.
// Two calls total, both requesting STRICT JSON output — no markdown fences,
// no preamble. Structured extraction first; scores are computed afterward
// in scoring.js, not asked for directly. That's what makes the numbers
// reproducible instead of a fresh model guess every run.

// Short descriptions matching FluidScriptr's conversion settings UI, used to
// tell the analysis model what the conversion was actually trying to do —
// without this, the same "omission" gets judged the same way regardless of
// whether the user asked for a faithful feature-length adaptation or an
// intentionally selective short-film treatment of one chapter.
const FORMAT_GUIDANCE = {
  "Feature Film": "adapts the FULL manuscript into a 90-110 page standalone film. High scene retention across the whole book is expected.",
  "Limited Series": "adapts the FULL manuscript across 2-8 episodes. High scene retention across the whole book is expected.",
  "TV Pilot": "adapts only the OPENING/setup of the manuscript to hook viewers — it is NOT meant to cover the full book yet. Do not treat later manuscript material as a damaging omission; this format only needs the early world/hook to land.",
  "Short Film": "adapts a SINGLE key scene or chapter, not the whole manuscript. Most of the book is expected to be entirely untouched by design — only flag omissions within the specific chapter/scene this short film is actually drawing from, not the rest of the book.",
};

const APPROACH_GUIDANCE = {
  "Compress": "the full story is meant to be PRESERVED, just tightened to fit. Omissions should be rare and mostly cosmetic — anything load-bearing missing is a real gap against the stated goal.",
  "Select Best": "the adaptation was explicitly told to select the most cinematic scenes, cutting the rest. Significant omissions here are curatorial choices, not failures — reserve \"load_bearing\" only for cuts that would break the core throughline (protagonist's arc, central relationship, ending) even under an intentionally selective edit.",
  "Faithful": "the explicit instruction was to stay close to the source within format constraints. Omissions should be minimal, and load-bearing cuts represent a meaningful deviation from the stated goal.",
};

const TONE_GUIDANCE = {
  "Faithful to source": "the manuscript's original tone should carry through largely unchanged. A tonal shift here is worth noting as a real fidelity concern.",
  "Cinematic / visual-first": "internal monologue, reflection, and interiority in the manuscript are EXPECTED to be translated into visual staging/action rather than preserved as text or dialogue. Do not treat that translation itself as an omission — only flag it if the underlying meaning or story beat is actually lost, not just its original textual form.",
  "Compressed / tight pacing": "scenes are meant to move quickly with little lingering. Some trimming of lower-stakes detail and beats is expected as a tonal choice, not a lapse.",
  "Expanded with subtext": "the screenplay is expected to add material beyond the source — new beats, implied meaning, or subtext. Treat reasonable \"expanded\" relationships and some invented content as intentional deepening, not unwarranted fabrication, unless it contradicts the source.",
};

const DIALOGUE_STYLE_GUIDANCE = {
  "Naturalistic": "dialogue should sound like natural speech. Rewriting manuscript lines/narration into naturalistic speech is expected; treat that as \"rewritten\" or \"lightly_edited\" rather than penalizing it as a deviation.",
  "Stylized / Literary": "dialogue is meant to be heightened or literary rather than plain speech. Invented or substantially rewritten lines that serve this heightened voice are appropriate, not a fidelity problem.",
  "Minimal — let visuals carry": "dialogue is MEANT to shrink — many manuscript conversations are expected to be replaced by visual action rather than spoken lines. A high manuscript_only_lines_count under this style often reflects the intended design (dialogue deliberately cut in favor of visuals), not lost content. Do not treat this reduction alone as a fidelity failure.",
  "Heavy subtext": "lines are meant to be understated or oblique on the surface, carrying meaning indirectly. Expect \"rewritten\" dialogue that says less literally than the manuscript source while implying the same thing — this is the intended effect, not information loss.",
};

function buildConversionContext(conversionSettings = {}) {
  const { targetFormat, adaptationApproach, tone, dialogueStyle } = conversionSettings;
  if (!targetFormat && !adaptationApproach && !tone && !dialogueStyle) return "";

  const lines = ["CONVERSION CONTEXT — this screenplay was generated with the following settings. Use them to calibrate your classifications; material cut or changed in service of the chosen settings is often appropriate, not a flaw."];
  if (targetFormat) {
    lines.push(`- Target Format: ${targetFormat} — ${FORMAT_GUIDANCE[targetFormat] || "no specific guidance available for this format."}`);
  }
  if (adaptationApproach) {
    lines.push(`- Adaptation Approach: ${adaptationApproach} — ${APPROACH_GUIDANCE[adaptationApproach] || "no specific guidance available for this approach."}`);
  }
  if (tone) lines.push(`- Tone: ${tone} — ${TONE_GUIDANCE[tone] || "no specific guidance available for this tone."}`);
  if (dialogueStyle) lines.push(`- Dialogue Style: ${dialogueStyle} — ${DIALOGUE_STYLE_GUIDANCE[dialogueStyle] || "no specific guidance available for this dialogue style."}`);

  return lines.join("\n") + "\n\n";
}

function buildStructuralAndOmissionPrompt(manuscriptText, screenplayText, conversionSettings = {}) {
  const system = `You are a structural analyst comparing a book manuscript to its screenplay adaptation.

${buildConversionContext(conversionSettings)}STEP 0 — DETERMINE SCOPE FIRST, before anything else. Some formats (Short Film, TV Pilot) only ever intend to adapt PART of the manuscript by design. Read the screenplay first, then identify which portion(s) of the manuscript it actually draws from — that is the "in-scope" material. Any manuscript unit that falls clearly outside that adapted scope (material the screenplay was never going to touch, given the format) must be marked "out_of_scope" in the mapping below — NOT "omitted". Reserve "omitted" strictly for material that fell WITHIN the intended scope but was still left out. Likewise, do not list content-level omissions (step 4 below) for elements that live entirely outside the in-scope material — only flag omissions from within the portion the screenplay was actually adapting.

Then identify:
1. The manuscript's major structural units (chapters or scenes), grouped into Act 1 / Act 2 / Act 3 based on story position.
2. The screenplay's major scenes, similarly grouped into Act 1 / Act 2 / Act 3.
3. A mapping from manuscript units to screenplay scenes. Each manuscript unit gets exactly one relationship:
   - "adapted": clean 1:1 correspondence
   - "merged": this unit was combined with others into one screenplay scene
   - "split": this unit became multiple screenplay scenes
   - "expanded": the screenplay adds significant new material to this unit
   - "omitted": WITHIN the in-scope material, but no corresponding screenplay content exists
   - "out_of_scope": outside the material this screenplay was ever adapting, given its format (see Step 0) — this is not a fidelity problem
4. A list of manuscript elements that do NOT appear in the screenplay at all: subplots, character beats, thematic threads, minor characters, world/setting details. Only include elements from WITHIN the in-scope material (per Step 0). For each, classify narrative importance IN LIGHT OF THE CONVERSION CONTEXT ABOVE:
   - "load_bearing": removing it changes the story's meaning or a character's motivation, even accounting for the chosen format and approach
   - "moderate": noticeable but not structurally critical
   - "cosmetic": detail-level, low impact if cut
   Give a one-sentence reason for each classification.

Keep every "summary" field to one short sentence, under 15 words. This keeps the response a manageable size for longer manuscripts.

Your entire response must be a single JSON object and nothing else. Do not include a preamble, an explanation, an apology, or any text before or after the JSON. Do not wrap it in markdown code fences. The first character of your response must be "{" and the last character must be "}". Match this exact shape:
{
  "manuscript_structure": [{"id": "M1", "act": 1, "label": "string", "summary": "string"}],
  "screenplay_structure": [{"id": "S1", "act": 1, "label": "string", "summary": "string"}],
  "mapping": [{"manuscript_id": "M1", "screenplay_ids": ["S1"], "relationship": "adapted|merged|split|expanded|omitted|out_of_scope"}],
  "omissions": [{"element": "string", "type": "subplot|character_beat|theme|minor_character|setting_detail", "description": "string", "classification": "load_bearing|moderate|cosmetic", "reason": "string"}]
}`;

  const user = `MANUSCRIPT:\n${manuscriptText}\n\n---\n\nSCREENPLAY:\n${screenplayText}`;

  return { system, user };
}

function buildDialoguePrompt(manuscriptText, screenplayText, conversionSettings = {}) {
  const system = `You are comparing dialogue between a book manuscript and its screenplay adaptation.

${buildConversionContext(conversionSettings)}Identify dialogue exchanges — where a screenplay line clearly derives from a manuscript line (spoken dialogue, or narration converted into spoken dialogue) — and classify each:
- "verbatim": word-for-word or nearly identical to the manuscript source
- "lightly_edited": same meaning and most wording, minor changes for format or brevity
- "rewritten": same story beat or intent, substantially reworded for the screen
- "invented": no clear manuscript source; new dialogue created for the adaptation

IMPORTANT — keep the response compact:
1. Quote only the FIRST 8-10 WORDS of each manuscript_line and screenplay_line — just enough to identify which exchange it is, not the full line. Do not reproduce entire passages.
2. Extract a REPRESENTATIVE SAMPLE spread across the whole excerpt (aim for roughly 20-30 exchanges) rather than exhaustively listing every single line. Prioritize exchanges that best illustrate the range of transformation (some verbatim, some rewritten, some invented) rather than covering every line.
3. Despite sampling the pairs list, still give your best full-excerpt ESTIMATE for the two count fields below — these should reflect the whole excerpt, not just the sampled pairs.

Count fields (full-excerpt estimates, not sample-only):
- estimated_total_matched_exchanges: your best estimate of the TOTAL number of dialogue exchanges across the whole excerpt that have a manuscript source (i.e. the full population the sample above was drawn from — not just the ~20-30 you listed)
- screenplay_only_lines_count: invented dialogue with no manuscript equivalent at all
- manuscript_only_lines_count: spoken dialogue or narration in the book that did not make it into the screenplay in any form

Your entire response must be a single JSON object and nothing else. Do not include a preamble, an explanation, an apology, or any text before or after the JSON. Do not wrap it in markdown code fences. The first character of your response must be "{" and the last character must be "}". Match this exact shape:
{
  "dialogue_pairs": [{"manuscript_line": "string (8-10 words max)", "screenplay_line": "string (8-10 words max)", "category": "verbatim|lightly_edited|rewritten|invented"}],
  "estimated_total_matched_exchanges": 0,
  "screenplay_only_lines_count": 0,
  "manuscript_only_lines_count": 0
}`;

  const user = `MANUSCRIPT:\n${manuscriptText}\n\n---\n\nSCREENPLAY:\n${screenplayText}`;

  return { system, user };
}

module.exports = { buildStructuralAndOmissionPrompt, buildDialoguePrompt };
