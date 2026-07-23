#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════
// FluidScriptr Fidelity Patch v4 — resolves a prompt conflict blocking
// out_of_scope from actually being used on partial conversions
//
// Problem found: STEP 0's original instruction says "only use out_of_scope
// if the SCREENPLAY TEXT ITSELF shows deliberate exclusion." That line was
// written to stop the model from wrongly assuming Short Film = chapter-
// skipping (correct fix at the time) — but it now also blocks the model
// from trusting the v3 partial-conversion percentage, since that's
// external evidence, not something visible in the screenplay text. The
// older, more emphatic instruction was winning, so the un-converted
// remainder of a partial conversion was still being scored as real
// omissions instead of being marked out_of_scope.
//
// Fix: STEP 0 now explicitly says the partial-conversion percentage is
// authoritative and outranks the "infer from text" default.
//
// Usage:
//   node apply-fidelity-patch-v4.js /path/to/FluidScriptr-App.html
// ══════════════════════════════════════════════════════════════════════

const fs = require('fs');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('❌ Usage: node apply-fidelity-patch-v4.js /path/to/FluidScriptr-App.html');
  process.exit(1);
}
if (!fs.existsSync(inputPath)) {
  console.error('❌ Could not find file at: ' + inputPath);
  process.exit(1);
}

const original = fs.readFileSync(inputPath, 'utf8');

const anchor = Buffer.from('U1RFUCAwIOKAlCBTQ09QRSBDSEVDSyAocmFyZSDigJQgbW9zdCBjb252ZXJzaW9ucyB1c2UgdGhlIHdob2xlIHN1Ym1pdHRlZCBzb3VyY2UpLiBUaGUgcmVhbCBwaXBlbGluZSBjb21wcmVzc2VzIHRoZSBFTlRJUkUgc3VibWl0dGVkIG1hbnVzY3JpcHQgaW50byB0aGUgdGFyZ2V0IGZvcm1hdCDigJQgaXQgZG9lcyBub3Qgc2tpcCBjaGFwdGVycyBieSBmb3JtYXQgY2hvaWNlLiBTbyBieSBkZWZhdWx0LCBFVkVSWSBtYW51c2NyaXB0IHVuaXQgc2hvdWxkIGdldCBhIHJlYWwgcmVsYXRpb25zaGlwIChhZGFwdGVkL21lcmdlZC9zcGxpdC9leHBhbmRlZC9vbWl0dGVkKSwgbm90ICJvdXRfb2Zfc2NvcGUiLiBPbmx5IHVzZSAib3V0X29mX3Njb3BlIiBpZiB0aGUgc2NyZWVucGxheSB0ZXh0IGl0c2VsZiBtYWtlcyBjbGVhciB0aGF0IHNvbWUgcG9ydGlvbiBvZiB0aGUgUFJPVklERUQgbWFudXNjcmlwdCB3YXMgZGVsaWJlcmF0ZWx5IGV4Y2x1ZGVkIOKAlCBuZXZlciB1c2UgaXQgdG8gcmVwcmVzZW50IG1hdGVyaWFsIG91dHNpZGUgd2hhdCB5b3Ugd2VyZSBnaXZlbi4=', 'base64').toString('utf8');
const replacement = Buffer.from('U1RFUCAwIOKAlCBTQ09QRSBDSEVDSy4gQnkgZGVmYXVsdCwgbW9zdCBjb252ZXJzaW9ucyB1c2UgdGhlIHdob2xlIHN1Ym1pdHRlZCBzb3VyY2UsIGFuZCBFVkVSWSBtYW51c2NyaXB0IHVuaXQgc2hvdWxkIGdldCBhIHJlYWwgcmVsYXRpb25zaGlwIChhZGFwdGVkL21lcmdlZC9zcGxpdC9leHBhbmRlZC9vbWl0dGVkKSwgbm90ICJvdXRfb2Zfc2NvcGUiIOKAlCBkbyBub3QgYXNzdW1lIGZvcm1hdCBjaG9pY2UgYWxvbmUgKGUuZy4gU2hvcnQgRmlsbSkgbWVhbnMgY2hhcHRlcnMgd2VyZSBza2lwcGVkOyB0aGUgcmVhbCBwaXBlbGluZSBjb21wcmVzc2VzIHRoZSBlbnRpcmUgc3VibWl0dGVkIG1hbnVzY3JpcHQgdW5sZXNzIHRvbGQgb3RoZXJ3aXNlIGJlbG93LgoKRVhDRVBUSU9OIOKAlCBpZiB0aGUgQ09OVkVSU0lPTiBDT05URVhUIGFib3ZlIHN0YXRlcyB0aGlzIHdhcyBhIFBBUlRJQUwgQ09OVkVSU0lPTiB3aXRoIGEgc3BlY2lmaWMgcGVyY2VudGFnZSwgdGhhdCBwZXJjZW50YWdlIGlzIGF1dGhvcml0YXRpdmUsIFZFUklGSUVEIGluZm9ybWF0aW9uIGFib3V0IHdoYXQgd2FzIGFjdHVhbGx5IGdlbmVyYXRlZCDigJQgaXQgaXMgbm90IGEgdGV4dHVhbCBpbmZlcmVuY2UgYW5kIG91dHJhbmtzIHRoZSBkZWZhdWx0IHJ1bGUgYWJvdmUuIEluIHRoYXQgY2FzZSwgbWFyayBtYW51c2NyaXB0IHVuaXRzIGJleW9uZCB0aGUgc3RhdGVkIGJvdW5kYXJ5IGFzICJvdXRfb2Zfc2NvcGUiIGV2ZW4gd2l0aG91dCBhZGRpdGlvbmFsIGV2aWRlbmNlIGluIHRoZSBzY3JlZW5wbGF5IHRleHQgaXRzZWxmLCBzaW5jZSB0aGF0IHJlbWFpbmRlciB3YXMgbmV2ZXIgYXR0ZW1wdGVkLCBub3QgY3JlYXRpdmVseSBleGNsdWRlZC4gT25seSBmYWxsIGJhY2sgdG8gaW5mZXJyaW5nIHNjb3BlIGZyb20gdGhlIHNjcmVlbnBsYXkgdGV4dCBpdHNlbGYgd2hlbiBubyBQQVJUSUFMIENPTlZFUlNJT04gbm90ZSBpcyBwcmVzZW50IGFib3ZlLg==', 'base64').toString('utf8');

const count = original.split(anchor).length - 1;
console.log('Checking anchor in your file...');
console.log('  STEP 0 anchor: found ' + count + ' time(s) (expected: 1)');

if (count !== 1) {
  console.error('');
  console.error('❌ STOPPING — anchor did not match exactly once.');
  console.error('   Nothing was written. Send this output back for a corrected patch.');
  process.exit(1);
}

const patched = original.replace(anchor, replacement);
const outputPath = inputPath.replace(/\.html$/i, '') + '.v4.html';
fs.writeFileSync(outputPath, patched, 'utf8');

console.log('');
console.log('✅ Patch v4 applied successfully.');
console.log('   New file written to: ' + outputPath);
console.log('   Your input file was NOT modified.');
console.log('');
console.log('Next: re-run the same partial-conversion test one more time. The');
console.log('un-converted remainder should now actually show up as out_of_scope');
console.log('in the mapping, and Omission Impact should rise accordingly (since');
console.log('most of what was previously scored as omissions was never a real cut).');
