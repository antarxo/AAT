import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, '..', 'app');

const requiredFiles = [
  'index.html',
  'aat-stage.css',
  'dialogs-gr.json',
  'dialogs-en.json',
  'intro.json',
  'intro-en.json',
  'spring.png',
  'skater.png',
  'koino.png',
  'koino_extra.png',
  'koino_final.png',
  'book.html',
  'book-gr.json',
  'book-en.json',
  'assets/theatron-banner.png',
  'assets/theatron-banner-en.png',
  'vendor/uPlot.min.css',
  'vendor/uPlot.iife.min.js',
  'vendor/uPlot-LICENSE.txt',
  'desktop-probe-build.json'
];

const forbiddenPackagedFiles = [
  '4adapter.js',
  '0act1-config.js',
  '1act3.js',
  'editor.html',
  'bookEditor.html',
  'aat.html',
  'laat.html'
];

for (const file of requiredFiles) {
  await access(join(appDir, file));
}

for (const file of forbiddenPackagedFiles) {
  try {
    await access(join(appDir, file));
    throw new Error(`Legacy/non-runtime file was packaged unexpectedly: ${file}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

const activeTextFiles = [
  'index.html',
  'aat-stage.css',
  'dialogs-gr.json',
  'dialogs-en.json',
  'intro.json',
  'intro-en.json',
  'book.html',
  'book.json',
  'book-gr.json',
  'book-en.json'
];

const textByFile = new Map();
for (const file of activeTextFiles) {
  textByFile.set(file, await readFile(join(appDir, file), 'utf8'));
}

const index = textByFile.get('index.html');
const forbiddenNetworkReferences = [
  'https://unpkg.com/uplot@1.6.30/dist/uPlot.min.css',
  'https://unpkg.com/uplot@1.6.30/dist/uPlot.iife.min.js'
];

for (const reference of forbiddenNetworkReferences) {
  if (index.includes(reference)) {
    throw new Error(`Offline packaging failed; index.html still contains ${reference}`);
  }
}

for (const reference of ['./vendor/uPlot.min.css', './vendor/uPlot.iife.min.js']) {
  if (!index.includes(reference)) {
    throw new Error(`Offline packaging failed; index.html does not contain ${reference}`);
  }
}

const externalUrls = [];
for (const [file, text] of textByFile) {
  for (const match of text.matchAll(/https?:\/\/[^\s"'<>]+/g)) {
    externalUrls.push(`${file}: ${match[0]}`);
  }
}

if (externalUrls.length) {
  throw new Error(
    `Active runtime still contains external URLs:\n${externalUrls.join('\n')}`
  );
}

const rootEntries = await readdir(appDir);
console.log(
  `Desktop probe static check passed ` +
  `(${requiredFiles.length} required files, ${rootEntries.length} packaged root entries).`
);
