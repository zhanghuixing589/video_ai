import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const maxBytes = 500 * 1024;
const assetsDir = join(process.cwd(), 'dist', 'assets');
const files = await readdir(assetsDir);
const jsFiles = files.filter((file) => file.endsWith('.js'));
const oversized = [];

for (const file of jsFiles) {
  const size = (await stat(join(assetsDir, file))).size;
  if (size > maxBytes) {
    oversized.push(`${file} ${(size / 1024).toFixed(1)} KiB`);
  }
}

if (oversized.length > 0) {
  console.error(`JS chunks exceed 500 KiB:\n${oversized.join('\n')}`);
  process.exit(1);
}

console.log(`All ${jsFiles.length} JS chunks are under 500 KiB.`);
