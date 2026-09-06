/**
 * Generates .webp siblings for large public/ raster assets (skips if up to date).
 * Run: npm run optimize:images
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(frontendRoot, 'public');
const RASTER = new Set(['.jpg', '.jpeg', '.png']);
const SKIP_DIRS = new Set(['payment-methods']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      files.push(...(await walk(fullPath)));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (RASTER.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function shouldConvert(sourcePath, targetPath) {
  try {
    const [sourceStat, targetStat] = await Promise.all([stat(sourcePath), stat(targetPath)]);
    return sourceStat.mtimeMs > targetStat.mtimeMs;
  } catch {
    return true;
  }
}

async function convertFile(sourcePath) {
  const targetPath = `${sourcePath.replace(/\.(jpe?g|png)$/i, '')}.webp`;
  if (!(await shouldConvert(sourcePath, targetPath))) {
    return { sourcePath, skipped: true };
  }

  const image = sharp(sourcePath);
  const metadata = await image.metadata();
  const pipeline =
    (metadata.width ?? 0) > 1920
      ? image.resize({ width: 1920, withoutEnlargement: true })
      : image;

  await pipeline.webp({ quality: 82, effort: 4 }).toFile(targetPath);

  const [before, after] = await Promise.all([stat(sourcePath), stat(targetPath)]);
  return {
    sourcePath,
    targetPath,
    beforeKb: Math.round(before.size / 1024),
    afterKb: Math.round(after.size / 1024),
    skipped: false,
  };
}

const files = await walk(publicDir);
const results = [];

for (const file of files) {
  results.push(await convertFile(file));
}

const converted = results.filter((r) => !r.skipped);
const skipped = results.length - converted.length;
const savedKb = converted.reduce((sum, r) => sum + Math.max(0, (r.beforeKb ?? 0) - (r.afterKb ?? 0)), 0);

console.log(`WebP: ${converted.length} converted, ${skipped} skipped, ~${savedKb} KiB saved`);
for (const row of converted) {
  console.log(`  ${path.relative(publicDir, row.sourcePath)} → ${row.afterKb} KiB (was ${row.beforeKb} KiB)`);
}
