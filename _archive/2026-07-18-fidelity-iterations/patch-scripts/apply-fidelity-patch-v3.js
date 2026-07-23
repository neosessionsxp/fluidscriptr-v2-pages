#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════
// FluidScriptr Fidelity Patch v3 — fixes Omission Impact on partial conversions
//
// Problem: for a partial conversion (e.g. 10% slider), the un-converted 90%
// of the manuscript was being treated as "omitted" content needing severity
// judgment, when really it's just "not generated yet" — not a creative
// choice at all. This made Omission Impact misleadingly forgiving on
// partial runs (Scene Retention already correctly showed this as low).
//
// Fix: FluidScriptr already tracks exactly how much was converted
// (state._chunksConverted / state._totalChunks). This patch passes that
// real boundary into the fidelity prompts directly, so the model marks
// the un-converted remainder as "out_of_scope" instead of guessing.
//
// Usage:
//   node apply-fidelity-patch-v3.js /path/to/FluidScriptr-App.html
// ══════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('❌ Usage: node apply-fidelity-patch-v3.js /path/to/FluidScriptr-App.html');
  process.exit(1);
}
if (!fs.existsSync(inputPath)) {
  console.error('❌ Could not find file at: ' + inputPath);
  process.exit(1);
}

const original = fs.readFileSync(inputPath, 'utf8');

const anchor1 = Buffer.from('ZnVuY3Rpb24gYnVpbGRGaWRlbGl0eUNvbnZlcnNpb25TZXR0aW5ncygpIHsKICBjb25zdCBzb3VyY2VXb3JkQ291bnQgPSBzdGF0ZS5yYXdUZXh0ID8gc3RhdGUucmF3VGV4dC5zcGxpdCgvXHMrLykuZmlsdGVyKEJvb2xlYW4pLmxlbmd0aCA6IDA7CiAgcmV0dXJuIHsKICAgIHRhcmdldEZvcm1hdDogRklERUxJVFlfRk9STUFUX01BUFtzdGF0ZS5mb3JtYXRdIHx8IG51bGwsCiAgICBhZGFwdGF0aW9uQXBwcm9hY2g6IEZJREVMSVRZX0FQUFJPQUNIX01BUFtzdGF0ZS5hcHByb2FjaF0gfHwgbnVsbCwKICAgIHRvbmU6IEZJREVMSVRZX1RPTkVfTUFQW3N0YXRlLnRvbmVdIHx8IG51bGwsCiAgICBkaWFsb2d1ZVN0eWxlOiBGSURFTElUWV9ESUFMT0dVRV9NQVBbc3RhdGUuZGlhbG9ndWVdIHx8IG51bGwsCiAgICBzb3VyY2VXb3JkQ291bnQsCiAgICB0YXJnZXRQYWdlczogZ2V0RmlkZWxpdHlUYXJnZXRQYWdlcygpLAogIH07Cn0=', 'base64').toString('utf8');
const anchor2 = Buffer.from('ZnVuY3Rpb24gYnVpbGRGaWRlbGl0eUNvbnZlcnNpb25Db250ZXh0KGNzKSB7CiAgY29uc3QgbGluZXMgPSBbIkNPTlZFUlNJT04gQ09OVEVYVCDigJQgdGhpcyBzY3JlZW5wbGF5IHdhcyBnZW5lcmF0ZWQgd2l0aCB0aGUgZm9sbG93aW5nIHNldHRpbmdzLiBVc2UgdGhlbSB0byBjYWxpYnJhdGUgeW91ciBjbGFzc2lmaWNhdGlvbnM7IG1hdGVyaWFsIGN1dCBvciBjaGFuZ2VkIGluIHNlcnZpY2Ugb2YgdGhlIGNob3NlbiBzZXR0aW5ncyBpcyBvZnRlbiBhcHByb3ByaWF0ZSwgbm90IGEgZmxhdy4iXTsKICBpZiAoY3MudGFyZ2V0Rm9ybWF0KSBsaW5lcy5wdXNoKGAtIFRhcmdldCBGb3JtYXQ6ICR7Y3MudGFyZ2V0Rm9ybWF0fSDigJQgJHtGSURFTElUWV9GT1JNQVRfR1VJREFOQ0VbY3MudGFyZ2V0Rm9ybWF0XSB8fCAibm8gc3BlY2lmaWMgZ3VpZGFuY2UgYXZhaWxhYmxlLiJ9YCk7CiAgaWYgKGNzLmFkYXB0YXRpb25BcHByb2FjaCkgbGluZXMucHVzaChgLSBBZGFwdGF0aW9uIEFwcHJvYWNoOiAke2NzLmFkYXB0YXRpb25BcHByb2FjaH0g4oCUICR7RklERUxJVFlfQVBQUk9BQ0hfR1VJREFOQ0VbY3MuYWRhcHRhdGlvbkFwcHJvYWNoXSB8fCAibm8gc3BlY2lmaWMgZ3VpZGFuY2UgYXZhaWxhYmxlLiJ9YCk7CiAgaWYgKGNzLnRvbmUpIGxpbmVzLnB1c2goYC0gVG9uZTogJHtjcy50b25lfSDigJQgJHtGSURFTElUWV9UT05FX0dVSURBTkNFW2NzLnRvbmVdIHx8ICJubyBzcGVjaWZpYyBndWlkYW5jZSBhdmFpbGFibGUuIn1gKTsKICBpZiAoY3MuZGlhbG9ndWVTdHlsZSkgbGluZXMucHVzaChgLSBEaWFsb2d1ZSBTdHlsZTogJHtjcy5kaWFsb2d1ZVN0eWxlfSDigJQgJHtGSURFTElUWV9ESUFMT0dVRV9TVFlMRV9HVUlEQU5DRVtjcy5kaWFsb2d1ZVN0eWxlXSB8fCAibm8gc3BlY2lmaWMgZ3VpZGFuY2UgYXZhaWxhYmxlLiJ9YCk7CiAgaWYgKGNzLnNvdXJjZVdvcmRDb3VudCAmJiBjcy50YXJnZXRQYWdlcykgewogICAgY29uc3Qgd29yZHNQZXJQYWdlID0gTWF0aC5yb3VuZChjcy5zb3VyY2VXb3JkQ291bnQgLyBjcy50YXJnZXRQYWdlcyk7CiAgICBsaW5lcy5wdXNoKGAtIENvbXByZXNzaW9uOiB+JHtjcy5zb3VyY2VXb3JkQ291bnQudG9Mb2NhbGVTdHJpbmcoKX0gc291cmNlIHdvcmRzIGNvbXByZXNzZWQgaW50byBhIH4ke2NzLnRhcmdldFBhZ2VzfS1wYWdlIHRhcmdldCAofiR7d29yZHNQZXJQYWdlfSBzb3VyY2Ugd29yZHMgcGVyIGZpbmlzaGVkIHBhZ2UpLiBBdCBoaWdoZXIgcmF0aW9zLCBtb3JlIHRyaW1taW5nIGFuZCBtZXJnaW5nIGlzIHN0cnVjdHVyYWxseSBuZWNlc3NhcnkgYW5kIHNob3VsZCBub3QgYnkgaXRzZWxmIGJlIHRyZWF0ZWQgYXMgYSBmaWRlbGl0eSBmYWlsdXJlIOKAlCBqdWRnZSBieSB3aGV0aGVyIHRoZSBlc3NlbnRpYWwgdGhyb3VnaGxpbmUgc3Vydml2ZWQsIG5vdCBieSB2b2x1bWUgb2YgY3V0cy5gKTsKICB9CiAgcmV0dXJuIGxpbmVzLmpvaW4oIlxuIikgKyAiXG5cbiI7Cn0=', 'base64').toString('utf8');
const replacement1 = Buffer.from('ZnVuY3Rpb24gYnVpbGRGaWRlbGl0eUNvbnZlcnNpb25TZXR0aW5ncygpIHsKICBjb25zdCBzb3VyY2VXb3JkQ291bnQgPSBzdGF0ZS5yYXdUZXh0ID8gc3RhdGUucmF3VGV4dC5zcGxpdCgvXHMrLykuZmlsdGVyKEJvb2xlYW4pLmxlbmd0aCA6IDA7CiAgLy8gSWYgdGhpcyB3YXMgYSBwYXJ0aWFsIGNvbnZlcnNpb24sIG9ubHkgdGhhdCBmaXJzdCBzbGljZSBvZiB0aGUgbWFudXNjcmlwdAogIC8vIHdhcyBhY3R1YWxseSBhdHRlbXB0ZWQg4oCUIHRoZSByZXN0IGlzIG91dCBvZiBzY29wZSBmb3IgdGhpcyBydW4sIG5vdCBvbWl0dGVkLgogIGNvbnN0IHBhcnRpYWxGcmFjdGlvbiA9IChzdGF0ZS5fdG90YWxDaHVua3MgJiYgc3RhdGUuX3RvdGFsQ2h1bmtzID4gMCkKICAgID8gTWF0aC5taW4oMSwgKHN0YXRlLl9jaHVua3NDb252ZXJ0ZWQgfHwgMCkgLyBzdGF0ZS5fdG90YWxDaHVua3MpCiAgICA6IDE7CiAgcmV0dXJuIHsKICAgIHRhcmdldEZvcm1hdDogRklERUxJVFlfRk9STUFUX01BUFtzdGF0ZS5mb3JtYXRdIHx8IG51bGwsCiAgICBhZGFwdGF0aW9uQXBwcm9hY2g6IEZJREVMSVRZX0FQUFJPQUNIX01BUFtzdGF0ZS5hcHByb2FjaF0gfHwgbnVsbCwKICAgIHRvbmU6IEZJREVMSVRZX1RPTkVfTUFQW3N0YXRlLnRvbmVdIHx8IG51bGwsCiAgICBkaWFsb2d1ZVN0eWxlOiBGSURFTElUWV9ESUFMT0dVRV9NQVBbc3RhdGUuZGlhbG9ndWVdIHx8IG51bGwsCiAgICBzb3VyY2VXb3JkQ291bnQsCiAgICB0YXJnZXRQYWdlczogZ2V0RmlkZWxpdHlUYXJnZXRQYWdlcygpLAogICAgcGFydGlhbEZyYWN0aW9uLAogIH07Cn0=', 'base64').toString('utf8');
const replacement2 = Buffer.from('ZnVuY3Rpb24gYnVpbGRGaWRlbGl0eUNvbnZlcnNpb25Db250ZXh0KGNzKSB7CiAgY29uc3QgbGluZXMgPSBbIkNPTlZFUlNJT04gQ09OVEVYVCDigJQgdGhpcyBzY3JlZW5wbGF5IHdhcyBnZW5lcmF0ZWQgd2l0aCB0aGUgZm9sbG93aW5nIHNldHRpbmdzLiBVc2UgdGhlbSB0byBjYWxpYnJhdGUgeW91ciBjbGFzc2lmaWNhdGlvbnM7IG1hdGVyaWFsIGN1dCBvciBjaGFuZ2VkIGluIHNlcnZpY2Ugb2YgdGhlIGNob3NlbiBzZXR0aW5ncyBpcyBvZnRlbiBhcHByb3ByaWF0ZSwgbm90IGEgZmxhdy4iXTsKICBpZiAoY3MudGFyZ2V0Rm9ybWF0KSBsaW5lcy5wdXNoKGAtIFRhcmdldCBGb3JtYXQ6ICR7Y3MudGFyZ2V0Rm9ybWF0fSDigJQgJHtGSURFTElUWV9GT1JNQVRfR1VJREFOQ0VbY3MudGFyZ2V0Rm9ybWF0XSB8fCAibm8gc3BlY2lmaWMgZ3VpZGFuY2UgYXZhaWxhYmxlLiJ9YCk7CiAgaWYgKGNzLmFkYXB0YXRpb25BcHByb2FjaCkgbGluZXMucHVzaChgLSBBZGFwdGF0aW9uIEFwcHJvYWNoOiAke2NzLmFkYXB0YXRpb25BcHByb2FjaH0g4oCUICR7RklERUxJVFlfQVBQUk9BQ0hfR1VJREFOQ0VbY3MuYWRhcHRhdGlvbkFwcHJvYWNoXSB8fCAibm8gc3BlY2lmaWMgZ3VpZGFuY2UgYXZhaWxhYmxlLiJ9YCk7CiAgaWYgKGNzLnRvbmUpIGxpbmVzLnB1c2goYC0gVG9uZTogJHtjcy50b25lfSDigJQgJHtGSURFTElUWV9UT05FX0dVSURBTkNFW2NzLnRvbmVdIHx8ICJubyBzcGVjaWZpYyBndWlkYW5jZSBhdmFpbGFibGUuIn1gKTsKICBpZiAoY3MuZGlhbG9ndWVTdHlsZSkgbGluZXMucHVzaChgLSBEaWFsb2d1ZSBTdHlsZTogJHtjcy5kaWFsb2d1ZVN0eWxlfSDigJQgJHtGSURFTElUWV9ESUFMT0dVRV9TVFlMRV9HVUlEQU5DRVtjcy5kaWFsb2d1ZVN0eWxlXSB8fCAibm8gc3BlY2lmaWMgZ3VpZGFuY2UgYXZhaWxhYmxlLiJ9YCk7CiAgaWYgKGNzLnNvdXJjZVdvcmRDb3VudCAmJiBjcy50YXJnZXRQYWdlcykgewogICAgY29uc3Qgd29yZHNQZXJQYWdlID0gTWF0aC5yb3VuZChjcy5zb3VyY2VXb3JkQ291bnQgLyBjcy50YXJnZXRQYWdlcyk7CiAgICBsaW5lcy5wdXNoKGAtIENvbXByZXNzaW9uOiB+JHtjcy5zb3VyY2VXb3JkQ291bnQudG9Mb2NhbGVTdHJpbmcoKX0gc291cmNlIHdvcmRzIGNvbXByZXNzZWQgaW50byBhIH4ke2NzLnRhcmdldFBhZ2VzfS1wYWdlIHRhcmdldCAofiR7d29yZHNQZXJQYWdlfSBzb3VyY2Ugd29yZHMgcGVyIGZpbmlzaGVkIHBhZ2UpLiBBdCBoaWdoZXIgcmF0aW9zLCBtb3JlIHRyaW1taW5nIGFuZCBtZXJnaW5nIGlzIHN0cnVjdHVyYWxseSBuZWNlc3NhcnkgYW5kIHNob3VsZCBub3QgYnkgaXRzZWxmIGJlIHRyZWF0ZWQgYXMgYSBmaWRlbGl0eSBmYWlsdXJlIOKAlCBqdWRnZSBieSB3aGV0aGVyIHRoZSBlc3NlbnRpYWwgdGhyb3VnaGxpbmUgc3Vydml2ZWQsIG5vdCBieSB2b2x1bWUgb2YgY3V0cy5gKTsKICB9CiAgaWYgKGNzLnBhcnRpYWxGcmFjdGlvbiAhPSBudWxsICYmIGNzLnBhcnRpYWxGcmFjdGlvbiA8IDAuOTgpIHsKICAgIGNvbnN0IHBjdCA9IE1hdGgucm91bmQoY3MucGFydGlhbEZyYWN0aW9uICogMTAwKTsKICAgIGxpbmVzLnB1c2goYC0gUEFSVElBTCBDT05WRVJTSU9OOiBvbmx5IGFwcHJveGltYXRlbHkgdGhlIEZJUlNUICR7cGN0fSUgb2YgdGhlIG1hbnVzY3JpcHQgKGJ5IGNvbnRlbnQgY2h1bmspIHdhcyBhY3R1YWxseSBjb252ZXJ0ZWQgaW4gdGhpcyBydW4g4oCUIHRoZSByZW1haW5pbmcgfiR7MTAwIC0gcGN0fSUgd2FzIG5ldmVyIGF0dGVtcHRlZC4gT25seSB0aGF0IGZpcnN0IH4ke3BjdH0lIGlzIGluIHNjb3BlIGZvciB0aGlzIGFuYWx5c2lzOiBtYXJrIG1hbnVzY3JpcHQgc3RydWN0dXJhbCB1bml0cyBmcm9tIHRoZSB1bi1jb252ZXJ0ZWQgcmVtYWluZGVyIGFzICJvdXRfb2Zfc2NvcGUiIChub3QgIm9taXR0ZWQiKSwgYW5kIGRvIG5vdCBsaXN0IGNvbnRlbnQtbGV2ZWwgb21pc3Npb25zIGZvciBhbnl0aGluZyBvdXRzaWRlIHRoYXQgZmlyc3QgcG9ydGlvbiwgc2luY2UgaXQgd2FzIG5ldmVyIGEgY3JlYXRpdmUgY2hvaWNlIOKAlCBpdCBzaW1wbHkgaGFzbid0IGJlZW4gZ2VuZXJhdGVkIHlldC5gKTsKICB9CiAgcmV0dXJuIGxpbmVzLmpvaW4oIlxuIikgKyAiXG5cbiI7Cn0=', 'base64').toString('utf8');

const anchors = [
  ['anchor1 (buildFidelityConversionSettings)', anchor1, replacement1],
  ['anchor2 (buildFidelityConversionContext)', anchor2, replacement2],
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

const outputPath = inputPath.replace(/\.html$/i, '') + '.v3.html';
fs.writeFileSync(outputPath, patched, 'utf8');

console.log('');
console.log('✅ Patch v3 applied successfully.');
console.log('   New file written to: ' + outputPath);
console.log('   Your input file was NOT modified.');
console.log('');
console.log('Next: re-run the same partial-conversion test. Omission Impact should');
console.log('now come out much lower, and un-converted chapters should show up');
console.log('as out_of_scope in the mapping rather than being scored as omissions.');
