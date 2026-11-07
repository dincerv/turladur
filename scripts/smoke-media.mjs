#!/usr/bin/env node
/**
 * Soft-launch media / R2 smoke checks.
 *
 * Usage:
 *   API_PUBLIC_URL=https://your-api.up.railway.app node scripts/smoke-media.mjs
 *   pnpm smoke:media
 *
 * Optional: MEDIA_SMOKE_KEY=tours/demo/cover.webp (must exist in bucket)
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function stripSlash(url) {
  return url.replace(/\/+$/, '');
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

async function main() {
  const apiBase = stripSlash(
    process.env.API_PUBLIC_URL ||
      process.env.SMOKE_API_URL ||
      'http://localhost:4000',
  );
  const cdnHint = process.env.CDN_URL?.trim();
  const mediaKey = process.env.MEDIA_SMOKE_KEY?.trim();

  console.log(`API_PUBLIC_URL=${apiBase}`);
  if (cdnHint) console.log(`CDN_URL=${cdnHint}`);

  // 1) Health
  try {
    const healthRes = await fetch(`${apiBase}/api/v1/health`);
    if (!healthRes.ok) {
      fail(`health HTTP ${healthRes.status}`);
    } else {
      const body = await healthRes.json().catch(() => null);
      ok(
        `health ${healthRes.status}${body?.data?.status ? ` status=${body.data.status}` : ''}`,
      );
    }
  } catch (err) {
    fail(`health unreachable: ${err.message}`);
  }

  // 2) Env contract hints (local process — does not read Railway secrets)
  const requiredProdHints = [
    'MINIO_ENDPOINT',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'S3_BUCKET',
  ];
  const missing = requiredProdHints.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    console.log(
      `NOTE: local process missing ${missing.join(', ')} — set them for R2 bucket probe (optional)`,
    );
  } else {
    try {
      const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');
      const endpoint = process.env.MINIO_ENDPOINT;
      const forcePathStyle =
        (process.env.S3_FORCE_PATH_STYLE ?? 'false').toLowerCase() !== 'false';
      const client = new S3Client({
        endpoint,
        region: process.env.S3_REGION || 'auto',
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY,
          secretAccessKey: process.env.MINIO_SECRET_KEY,
        },
        forcePathStyle,
      });
      const bucket = process.env.S3_BUCKET || 'tourtech-media';
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      ok(`R2/S3 bucket reachable: ${bucket}`);
    } catch (err) {
      fail(`R2/S3 probe: ${err.message}`);
    }
  }

  // 3) Media proxy path (404 without object is OK — proves route exists)
  const probeKey = mediaKey || '__smoke_missing__/probe.webp';
  const mediaUrl = `${apiBase}/api/v1/storage/media/${probeKey}`;
  try {
    const mediaRes = await fetch(mediaUrl, { method: 'HEAD' }).catch(() =>
      fetch(mediaUrl, { method: 'GET' }),
    );
    if (mediaRes.status === 200) {
      const ct = mediaRes.headers.get('content-type') || '';
      ok(`media proxy 200 for ${probeKey} (${ct})`);
    } else if (mediaRes.status === 404) {
      ok(
        `media proxy route alive (404 for missing key — upload a real file then set MEDIA_SMOKE_KEY)`,
      );
    } else {
      fail(`media proxy unexpected HTTP ${mediaRes.status} for ${mediaUrl}`);
    }
  } catch (err) {
    fail(`media proxy unreachable: ${err.message}`);
  }

  if (process.exitCode) {
    console.error('\nSmoke failed. Fix API/R2 env then retry.');
    process.exit(process.exitCode);
  }
  console.log('\nSmoke passed (soft-launch media path ready).');
}

main();
