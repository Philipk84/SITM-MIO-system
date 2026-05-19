const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const sliceDir = path.resolve(root, '..', 'common', 'src', 'main', 'slice');
const sliceFile = path.join(sliceDir, 'Mio.ice');
const outDir = path.resolve(root, 'src', 'ice', 'generated');

fs.mkdirSync(outDir, { recursive: true });

const result = spawnSync('slice2js', ['-I', sliceDir, sliceFile, '--output-dir', outDir], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`[WEB] Slice JS generado en: ${outDir}`);
