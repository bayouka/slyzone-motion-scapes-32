#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const BASE = join(ROOT, 'docs/project-definition/runtime');
const OUT = join(BASE, 'sql-candidates/G2_CONSOLIDATED_MIGRATION_CANDIDATE_V0_7.sql');
const AUTHORITY = 'G2_MIGRATION_PACKAGE_MANIFEST_V0_7.md';

const SOURCES = [
  ['sql-candidates/G2_SCHEMA_ADDITIONS_V0_1_FINAL.sql', 'b7edf9d24e89ecef41ee3cae34534aa0d76ec261'],
  ['sql-candidates/G0_CREATION_REDESIGN_RESOLVER_V0_4_RAW_SELECTION.sql', '1de7c2b71aef27d51ee90edec52dc85755ccd439'],
  ['sql-candidates/G2_FINAL_HELPERS_V0_1_AUTHORITY.sql', 'd26ebabf8adad81518b3a984d1bab37e39107da4'],
  ['sql-candidates/G2_REQUIREMENT_REF_FRESHNESS_V0_1.sql', '5fd671a55cc1923d1c53b45ebbf9af1e0e05c34b'],
  ['sql-candidates/G2_EVIDENCE_RECOMPUTE_V0_6_REF_FRESHNESS.sql', 'dda11080beff3dccdc5351d793488468fbb1ef80'],
  ['sql-candidates/G2_RESOLUTION_PATH_POLICY_V0_1.sql', 'd6e3f4f9cd8451b7453163a5371c7d0070e483e3'],
  ['sql-candidates/G2_EVIDENCE_PLANNER_V0_10_RESOLUTION_SAFE.sql', '9d02bbfdf72dc9187c9a7f72d6030b6426747cad'],
  ['sql-candidates/G2_HUMAN_BASIS_LINEAGE_V0_2_IDEMPOTENCY.sql', '6c76a9002e58761cf7007f9e858e62634fbe58bc'],
  ['sql-candidates/G2_ACCEPTED_UNKNOWN_V0_1_BASIS.sql', 'bc9efd2428c6f7b01ce3385620b450dee080c98f'],
  ['sql-candidates/G2_SYSTEM_ACTION_BOUNDARY_V0_1.sql', '0d6b344ff5aa24c4a925ef2bb8123ea58655085e'],
  ['sql-candidates/G2_ACTION_LIFECYCLE_V0_3_ATTEMPT_FENCED.sql', '7b3a57e5dd12cb909b5b997387f20b40f1ead90f'],
  ['sql-candidates/G2_EVIDENCE_PLANNER_V0_11_RECOVERY.sql', 'dad9816946a88617926af0eebc0299af3f29b08c'],
  ['sql-candidates/G2_ACTION_INPUT_BOUNDARY_V0_2_ATTEMPT_FENCED.sql', 'b38bd43084953f7224f0e0bec4bd33790bccbceb'],
  ['sql-candidates/G2_ATOMIC_RESEARCH_PROMOTION_V0_2_HARDENING.sql', '96a79139a2dd75976dd1824858f6e5bfb8dd3c19'],
  ['sql-candidates/G2_RESEARCH_ACTION_V0_4_BLUEPRINT_GUARD.sql', '75b5605fc61e909ce997044df7ece5170a50fb27'],
  ['sql-candidates/G2_RESEARCH_PROMOTION_V0_3_BLUEPRINT_GUARD.sql', '7f37fb85a531b3a2e0a8973ddbbac066843dad60'],
  ['sql-candidates/G2_NO_RESOLUTION_FINALIZATION_V0_1.sql', '56fe8d58bf2fcc845d2a964e8cfced48902bc8a6'],
];

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(buffer).digest('hex');
}

function assertSafeOutput(path) {
  const normalized = path.replaceAll('\\', '/');
  if (normalized.includes('/supabase/migrations/')) {
    throw new Error('Refusing to generate a candidate inside supabase/migrations/.');
  }
}

async function main() {
  assertSafeOutput(OUT);
  const pieces = [];
  const verified = [];

  for (const [relativePath, expectedSha] of SOURCES) {
    const absolutePath = join(BASE, relativePath);
    const buffer = await readFile(absolutePath);
    const actualSha = gitBlobSha(buffer);
    if (actualSha !== expectedSha) {
      throw new Error(`SHA mismatch for ${relativePath}: expected ${expectedSha}, got ${actualSha}. Freeze a new G2 migration package manifest before assembling.`);
    }
    const body = buffer.toString('utf8').replace(/\s+$/u, '');
    verified.push({ relativePath, sha: actualSha, bytes: buffer.length });
    pieces.push(`\n-- =============================================================================\n-- BEGIN SOURCE: ${relativePath}\n-- GIT BLOB SHA: ${actualSha}\n-- =============================================================================\n\n${body}\n\n-- =============================================================================\n-- END SOURCE: ${relativePath}\n-- =============================================================================\n`);
  }

  const header = `-- 4b4c / 2b2c — G2 CONSOLIDATED MIGRATION CANDIDATE V0.7\n-- GENERATED FILE — DO NOT EDIT BY HAND.\n-- Generator: scripts/build-g2-consolidated-candidate.mjs\n-- Authority: docs/project-definition/runtime/${AUTHORITY}\n-- STATUS: NON ACTIVE — DO NOT APPLY TO PRODUCTION.\n-- This file intentionally contains no BEGIN/COMMIT. Validation harnesses must wrap it\n-- in an explicit transaction and ROLLBACK until activation authority is granted.\n-- Source count: ${SOURCES.length}\n`;

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, header + pieces.join(''), 'utf8');
  process.stdout.write(JSON.stringify({ ok: true, output: OUT, authority: AUTHORITY, sourceCount: SOURCES.length, verified }, null, 2) + '\n');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
