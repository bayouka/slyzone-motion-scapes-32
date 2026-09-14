#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const BASE = join(ROOT, 'docs/project-definition/runtime');
const OUT = join(BASE, 'sql-candidates/G2_CONSOLIDATED_MIGRATION_CANDIDATE_V0_1.sql');

const SOURCES = [
  ['sql-candidates/G2_SCHEMA_ADDITIONS_V0_1_FINAL.sql', 'b7edf9d24e89ecef41ee3cae34534aa0d76ec261'],
  ['sql-candidates/G0_CREATION_REDESIGN_RESOLVER_V0_4_RAW_SELECTION.sql', '1de7c2b71aef27d51ee90edec52dc85755ccd439'],
  ['sql-candidates/G2_FINAL_HELPERS_V0_1_AUTHORITY.sql', 'd26ebabf8adad81518b3a984d1bab37e39107da4'],
  ['sql-candidates/G2_REQUIREMENT_REF_FRESHNESS_V0_1.sql', '5fd671a55cc1923d1c53b45ebbf9af1e0e05c34b'],
  ['sql-candidates/G2_EVIDENCE_RECOMPUTE_V0_6_REF_FRESHNESS.sql', 'dda11080beff3dccdc5351d793488468fbb1ef80'],
  ['sql-candidates/G2_EVIDENCE_PLANNER_V0_9_REF_FRESHNESS.sql', 'ba59b9562622328fed28ca206bdfc5f11f19cce4'],
  ['sql-candidates/G2_HUMAN_BASIS_LINEAGE_V0_2_IDEMPOTENCY.sql', '6c76a9002e58761cf7007f9e858e62634fbe58bc'],
  ['sql-candidates/G2_ACCEPTED_UNKNOWN_V0_1_BASIS.sql', 'bc9efd2428c6f7b01ce3385620b450dee080c98f'],
  ['sql-candidates/G2_SYSTEM_ACTION_BOUNDARY_V0_1.sql', '0d6b344ff5aa24c4a925ef2bb8123ea58655085e'],
  ['sql-candidates/G2_ACTION_LIFECYCLE_V0_2_UNIFIED.sql', 'c2c99b930bf5a2c11f7b4b0184d8c757e6e1ec0e'],
  ['sql-candidates/G2_RESEARCH_PROMOTION_CORE_V0_1_FINAL.sql', 'be192725a1fe9dc80a180c1b691cc4884e514db6'],
  ['sql-candidates/G2_RESEARCH_ACTION_V0_4_BLUEPRINT_GUARD.sql', '75b5605fc61e909ce997044df7ece5170a50fb27'],
  ['sql-candidates/G2_RESEARCH_PROMOTION_V0_3_BLUEPRINT_GUARD.sql', '7f37fb85a531b3a2e0a8973ddbbac066843dad60'],
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
      throw new Error(
        `SHA mismatch for ${relativePath}: expected ${expectedSha}, got ${actualSha}. ` +
        'Freeze a new G2 migration package manifest before assembling.'
      );
    }

    const body = buffer.toString('utf8').replace(/\s+$/u, '');
    verified.push({ relativePath, sha: actualSha, bytes: buffer.length });
    pieces.push(
      `\n-- =============================================================================\n` +
      `-- BEGIN SOURCE: ${relativePath}\n` +
      `-- GIT BLOB SHA: ${actualSha}\n` +
      `-- =============================================================================\n\n` +
      `${body}\n\n` +
      `-- =============================================================================\n` +
      `-- END SOURCE: ${relativePath}\n` +
      `-- =============================================================================\n`
    );
  }

  const header = `-- 4b4c / 2b2c — G2 CONSOLIDATED MIGRATION CANDIDATE V0.1\n` +
    `-- GENERATED FILE — DO NOT EDIT BY HAND.\n` +
    `-- Generator: scripts/build-g2-consolidated-candidate.mjs\n` +
    `-- Authority: docs/project-definition/runtime/G2_MIGRATION_PACKAGE_MANIFEST_V0_2.md\n` +
    `-- STATUS: NON ACTIVE — DO NOT APPLY TO PRODUCTION.\n` +
    `-- This file intentionally contains no BEGIN/COMMIT. Validation harnesses must wrap it\n` +
    `-- in an explicit transaction and ROLLBACK until activation authority is granted.\n` +
    `-- Source count: ${SOURCES.length}\n`;

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, header + pieces.join(''), 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        output: OUT,
        sourceCount: SOURCES.length,
        verified,
      },
      null,
      2
    ) + '\n'
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
