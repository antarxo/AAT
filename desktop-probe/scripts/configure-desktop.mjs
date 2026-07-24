import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { desktopDir, loadFactoryConfig } from './factory-config.mjs';

const { config } = await loadFactoryConfig();
const tauriDir = resolve(desktopDir, 'src-tauri');

const tauriConfig = {
  $schema: 'https://schema.tauri.app/config/2',
  productName: config.app.productName,
  version: config.app.version,
  identifier: config.app.identifier,
  build: {
    beforeDevCommand: 'node scripts/prepare-app.mjs',
    beforeBuildCommand: 'node scripts/prepare-app.mjs && node scripts/check-app.mjs',
    frontendDist: '../app'
  },
  app: {
    windows: [
      {
        label: 'main',
        title: config.app.title,
        ...config.app.window
      }
    ],
    security: {
      csp: null
    }
  },
  bundle: {
    active: true,
    targets: 'all',
    icon: [
      'icons/32x32.png',
      'icons/128x128.png',
      'icons/128x128@2x.png',
      'icons/icon.icns',
      'icons/icon.ico'
    ],
    shortDescription: config.app.description,
    longDescription: config.app.longDescription
  }
};

await writeFile(
  resolve(tauriDir, 'tauri.conf.json'),
  `${JSON.stringify(tauriConfig, null, 2)}\n`,
  'utf8'
);

const cargoPath = resolve(tauriDir, 'Cargo.toml');
let cargo = await readFile(cargoPath, 'utf8');

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Cargo.toml field not found: ${label}`);
  }
  return source.replace(pattern, replacement);
}

cargo = replaceRequired(
  cargo,
  /(\[package\][\s\S]*?\nname = )"[^"]+"/,
  (_, prefix) => `${prefix}"${config.app.binaryName}"`,
  'package.name'
);
cargo = replaceRequired(
  cargo,
  /(\[package\][\s\S]*?\nversion = )"[^"]+"/,
  (_, prefix) => `${prefix}"${config.app.version}"`,
  'package.version'
);
cargo = replaceRequired(
  cargo,
  /(\[package\][\s\S]*?\ndescription = )"[^"]+"/,
  (_, prefix) => `${prefix}${JSON.stringify(config.app.description)}`,
  'package.description'
);
cargo = replaceRequired(
  cargo,
  /(\[package\][\s\S]*?\nauthors = )\[[^\]]*\]/,
  (_, prefix) => `${prefix}${JSON.stringify(config.app.authors)}`,
  'package.authors'
);
await writeFile(cargoPath, cargo, 'utf8');

console.log(
  `Configured ${config.app.productName} ` +
  `(${config.app.binaryName} ${config.app.version}).`
);
