// Fills src/data/sampleRuns.js with verbatim responses from the live agent.
//
// /api/demo-qualify allows 3 runs per IP per hour (fieldsta-agents
// src/demo-limiter.ts), and a full set is 6 (three verticals x sample +
// weak), so this is built to be run repeatedly across hourly windows: it
// only requests entries that are missing, writes after every success, and
// stops cleanly on a 429 rather than losing what it already collected.
//
// Re-run it whenever the samples in LiveDemo's VERTICALS change, or the
// captured replies will be answering leads the page no longer shows.
//
//   node scripts/capture-sample-runs.mjs
//   node scripts/capture-sample-runs.mjs --only legal
//   node scripts/capture-sample-runs.mjs --force        # recapture everything

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src/data/sampleRuns.js");
const API = process.env.AGENTS_BASE_URL ?? "https://studio.fieldsta.com";

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const force = args.includes("--force");

// Parsed out of LiveDemo rather than duplicated, so the captures can't
// silently drift from the leads the page actually shows.
function readVerticals() {
  const src = readFileSync(join(ROOT, "src/pages/LiveDemo.jsx"), "utf8");
  const block = src.slice(src.indexOf("const VERTICALS = ["), src.indexOf("\n];", src.indexOf("const VERTICALS = [")));
  const out = [];
  for (const chunk of block.split(/\n\s*\{\s*\n/).slice(1)) {
    const get = (key) => {
      const m = chunk.match(new RegExp(`${key}:\\s*\\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`));
      return m ? JSON.parse(`"${m[1]}"`) : null;
    };
    const value = get("value");
    if (value) out.push({ value, sample: get("sample"), weakSample: get("weakSample") });
  }
  return out;
}

const KEEP = [
  "qualification", "score", "reasoning", "criteriaBreakdown",
  "missingInfo", "needsHumanReview", "reviewReason", "subject", "draftReply",
];

function readExisting() {
  if (!existsSync(DATA)) return {};
  const src = readFileSync(DATA, "utf8");
  const start = src.indexOf("{", src.indexOf("export const SAMPLE_RUNS"));
  const end = src.lastIndexOf("};");
  if (start < 0 || end < 0) return {};
  try {
    return JSON.parse(src.slice(start, end + 1));
  } catch {
    return {};
  }
}

async function capture(vertical, message) {
  const res = await fetch(`${API}/api/demo-qualify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vertical, message }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 429) return { rateLimited: true, message: body.message };
  if (!res.ok) throw new Error(`${res.status}: ${body.message ?? "unknown error"}`);
  return { data: Object.fromEntries(KEEP.filter((k) => k in body).map((k) => [k, body[k]])) };
}

const HEADER = `// Verbatim responses from the live Responder agent, captured by
// scripts/capture-sample-runs.mjs posting the samples in LiveDemo's VERTICALS
// to the same POST /api/demo-qualify the page calls at runtime. Not written
// by hand and not touched up -- that is the only reason it is honest to show
// them as what the product does.
//
// They exist so /try can show its payoff on load instead of behind a 20-40
// second wait, and so the fixed-input actions (the example run and the
// rejection demo) cost nothing: /api/demo-qualify allows only 3 runs per IP
// per hour, and spending them to reproduce a result already on the page left
// nothing for the visitor's own lead.
//
// Regenerate whenever VERTICALS changes -- stale captures would be answering
// leads the page no longer shows.

export const SAMPLE_RUNS = `;

const FOOTER = `;

// Null means "not captured yet", and callers must degrade rather than
// substitute another vertical's run -- it would be presented under this
// vertical's lead and would not be that lead's answer.
export function getSampleRun(vertical) {
  return SAMPLE_RUNS[vertical]?.sample ?? null;
}

export function getWeakRun(vertical) {
  return SAMPLE_RUNS[vertical]?.weak ?? null;
}
`;

const store = readExisting();
const verticals = readVerticals().filter((v) => !only || v.value === only);
let stopped = false;

for (const v of verticals) {
  for (const [kind, message] of [["sample", v.sample], ["weak", v.weakSample]]) {
    if (stopped || !message) continue;
    store[v.value] ??= {};
    if (store[v.value][kind] && !force) {
      console.log(`skip   ${v.value}/${kind} (already captured)`);
      continue;
    }
    process.stdout.write(`fetch  ${v.value}/${kind} ... `);
    const r = await capture(v.value, message);
    if (r.rateLimited) {
      console.log(`RATE LIMITED\n\n${r.message}\nRe-run later; captured work is saved.`);
      stopped = true;
      break;
    }
    store[v.value][kind] = r.data;
    writeFileSync(DATA, HEADER + JSON.stringify(store, null, 2) + FOOTER);
    console.log(`ok (${r.data.qualification}, score ${r.data.score?.score})`);
  }
}

const missing = [];
for (const v of readVerticals()) {
  for (const kind of ["sample", "weak"]) {
    if (!store[v.value]?.[kind]) missing.push(`${v.value}/${kind}`);
  }
}
console.log(missing.length ? `\nStill missing: ${missing.join(", ")}` : "\nComplete.");
