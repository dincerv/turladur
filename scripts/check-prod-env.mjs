#!/usr/bin/env node
/**
 * Prints soft-launch env contract and exits non-zero if critical vars missing
 * in the current process (load via dotenv manually or export before run).
 *
 *   node scripts/check-prod-env.mjs
 */
const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
  'API_PUBLIC_URL',
  'CDN_URL',
  'MINIO_ENDPOINT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'S3_BUCKET',
];

const recommended = [
  'REDIS_URL',
  'CORS_ALLOW_VERCEL',
  'S3_FORCE_PATH_STYLE',
  'OTP_SHOW_DEBUG_CODE',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];

const missing = required.filter((k) => !process.env[k]?.trim());
const weakJwt =
  process.env.JWT_SECRET &&
  ['change-me', 'secret', 'dev'].includes(process.env.JWT_SECRET.trim());

console.log('=== Soft-launch env check ===\n');
for (const k of required) {
  const v = process.env[k]?.trim();
  console.log(
    `${v ? 'OK ' : 'MISS'}  ${k}${v && k.includes('SECRET') ? '=***' : v ? `=${v.slice(0, 48)}${v.length > 48 ? '…' : ''}` : ''}`,
  );
}
console.log('');
for (const k of recommended) {
  const v = process.env[k]?.trim();
  console.log(`${v ? 'OK ' : '—  '}  ${k}`);
}

if (process.env.OTP_SHOW_DEBUG_CODE === 'true') {
  console.warn('\nWARN: OTP_SHOW_DEBUG_CODE=true (prod’da false olmalı)');
}
if (
  process.env.NODE_ENV === 'production' &&
  process.env.ENABLE_SWAGGER === 'true'
) {
  console.warn('WARN: ENABLE_SWAGGER=true in production');
}
if (weakJwt) {
  console.warn('WARN: JWT_SECRET looks weak');
}
if (
  process.env.CDN_URL?.includes('localhost') &&
  process.env.NODE_ENV === 'production'
) {
  console.warn('WARN: CDN_URL is localhost in production');
}

if (missing.length || weakJwt) {
  console.error(
    `\nMissing/weak: ${[...missing, weakJwt ? 'JWT_SECRET' : ''].filter(Boolean).join(', ')}`,
  );
  console.error('Template: infrastructure/cloudflare/soft-launch.env.example');
  process.exit(1);
}

console.log('\nRequired env present.');
