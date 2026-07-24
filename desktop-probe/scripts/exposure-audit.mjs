import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import {
  desktopDir,
  loadFactoryConfig,
  reportsDir
} from './factory-config.mjs';

const { config } = await loadFactoryConfig();
const binaryPath = process.argv[2]
  ? resolve(desktopDir, process.argv[2])
  : resolve(
      desktopDir,
      'src-tauri',
      'target',
      'release',
      `${config.app.binaryName}${process.platform === 'win32' ? '.exe' : ''}`
    );

const binary = await readFile(binaryPath);
const markerResults = (config.exposureAudit?.markers ?? []).map((marker) => {
  const utf8Found = binary.includes(Buffer.from(marker, 'utf8'));
  const utf16Found = binary.includes(Buffer.from(marker, 'utf16le'));
  return {
    marker,
    detected: utf8Found || utf16Found,
    encodings: [
      ...(utf8Found ? ['utf8'] : []),
      ...(utf16Found ? ['utf16le'] : [])
    ]
  };
});

const detectedCount = markerResults.filter((result) => result.detected).length;
const report = {
  kind: 'diagnostic-only-exposure-audit',
  factoryVersion: config.factoryVersion,
  productName: config.app.productName,
  binary: basename(binaryPath),
  sizeBytes: binary.length,
  sha256: createHash('sha256').update(binary).digest('hex'),
  markersDetected: detectedCount,
  markersChecked: markerResults.length,
  markerResults,
  interpretation:
    'A missing plain-text marker does not prove that bundled frontend source is ' +
    'non-extractable. Tauri resources may be encoded or compressed. This report ' +
    'measures casual string exposure only.'
};

await mkdir(reportsDir, { recursive: true });
await writeFile(
  resolve(reportsDir, 'exposure-report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);

const lines = [
  'HTML Desktop Factory — Exposure Audit',
  '',
  `Product: ${report.productName}`,
  `Binary: ${report.binary}`,
  `Size: ${report.sizeBytes} bytes`,
  `SHA-256: ${report.sha256}`,
  `Plain-text markers detected: ${detectedCount}/${markerResults.length}`,
  '',
  ...markerResults.map(
    (result) =>
      `[${result.detected ? 'DETECTED' : 'NOT DETECTED'}] ${result.marker}` +
      (result.encodings.length ? ` (${result.encodings.join(', ')})` : '')
  ),
  '',
  report.interpretation,
  ''
];
await writeFile(
  resolve(reportsDir, 'exposure-report.txt'),
  lines.join('\n'),
  'utf8'
);

console.log(
  `Exposure audit complete: ${detectedCount}/${markerResults.length} ` +
  `plain-text markers detected in ${basename(binaryPath)}.`
);
