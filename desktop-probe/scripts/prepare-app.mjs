import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopDir = resolve(scriptDir, '..');
const repositoryDir = resolve(desktopDir, '..');
const outputDir = join(desktopDir, 'app');

const applicationFiles = [
  'index.html',
  'aat-stage.css',
  'dialogs-gr.json',
  'dialogs-en.json',
  'intro.json',
  'intro-en.json',
  'book.html',
  'book.json',
  'book-gr.json',
  'book-en.json',
  'spring.png',
  'skater.png',
  'courtin.png',
  'koino.png',
  'koino_extra.png',
  'koino_final.png',
  'theatron-banner.png',
  'viewer1.png',
  'viewer2.png',
  'viewer3.png',
  'viewer4.png',
  'viewer5.png'
];

async function copyApplicationFiles() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  for (const file of applicationFiles) {
    await cp(join(repositoryDir, file), join(outputDir, file));
  }

  await cp(join(repositoryDir, 'assets'), join(outputDir, 'assets'), {
    recursive: true
  });
}

async function vendorUplot() {
  const vendorDir = join(outputDir, 'vendor');
  const uplotDist = join(desktopDir, 'node_modules', 'uplot', 'dist');
  await mkdir(vendorDir, { recursive: true });
  await cp(join(uplotDist, 'uPlot.min.css'), join(vendorDir, 'uPlot.min.css'));
  await cp(join(uplotDist, 'uPlot.iife.min.js'), join(vendorDir, 'uPlot.iife.min.js'));
  await cp(
    join(desktopDir, 'node_modules', 'uplot', 'LICENSE'),
    join(vendorDir, 'uPlot-LICENSE.txt')
  );

  const entryPath = join(outputDir, 'index.html');
  const source = await readFile(entryPath, 'utf8');
  const offlineSource = source
    .replace(
      'https://unpkg.com/uplot@1.6.30/dist/uPlot.min.css',
      './vendor/uPlot.min.css'
    )
    .replace(
      'https://unpkg.com/uplot@1.6.30/dist/uPlot.iife.min.js',
      './vendor/uPlot.iife.min.js'
    );

  if (offlineSource === source) {
    throw new Error('The expected uPlot CDN references were not found in index.html.');
  }

  await writeFile(entryPath, offlineSource, 'utf8');
}

async function writeBuildMetadata() {
  let sourceCommit = 'unknown';
  try {
    sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repositoryDir,
      encoding: 'utf8'
    }).trim();
  } catch {
    // Metadata is diagnostic only; packaging must not fail without git.
  }

  const metadata = {
    kind: 'diagnostic-only-desktop-probe',
    sourceRepository: 'antarxo/AAT',
    sourceCommit,
    generatedAt: new Date().toISOString(),
    protectionClaim: 'none'
  };

  await writeFile(
    join(outputDir, 'desktop-probe-build.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8'
  );
}

await copyApplicationFiles();
await vendorUplot();
await writeBuildMetadata();

console.log(`Prepared offline application files in ${outputDir}`);
