import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import {
  desktopDir,
  loadFactoryConfig,
  outputDir,
  repositoryDir,
  resolveWithin
} from './factory-config.mjs';

const { config, sourceDir } = await loadFactoryConfig();

async function copyApplicationFiles() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  for (const file of config.packaging.files) {
    const source = resolveWithin(sourceDir, file, `packaging file ${file}`);
    const destination = resolveWithin(outputDir, file, `packaging destination ${file}`);
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination);
  }

  for (const directory of config.packaging.directories) {
    const source = resolveWithin(sourceDir, directory, `packaging directory ${directory}`);
    const destination = resolveWithin(
      outputDir,
      directory,
      `packaging directory destination ${directory}`
    );
    await cp(source, destination, { recursive: true });
  }
}

async function vendorDependencies() {
  for (const vendor of config.packaging.vendor) {
    const packageDir = resolve(desktopDir, 'node_modules', vendor.package);
    for (const copyRule of vendor.copies) {
      const source = resolveWithin(
        packageDir,
        copyRule.from,
        `${vendor.package} vendor source ${copyRule.from}`
      );
      const destination = resolveWithin(
        outputDir,
        copyRule.to,
        `${vendor.package} vendor destination ${copyRule.to}`
      );
      await mkdir(dirname(destination), { recursive: true });
      await cp(source, destination);
    }
  }
}

async function applyOfflineReplacements() {
  const replacementsByFile = new Map();
  for (const replacement of config.packaging.replacements) {
    const rules = replacementsByFile.get(replacement.file) ?? [];
    rules.push(replacement);
    replacementsByFile.set(replacement.file, rules);
  }

  for (const [file, replacements] of replacementsByFile) {
    const target = resolveWithin(outputDir, file, `replacement target ${file}`);
    let source = await readFile(target, 'utf8');

    for (const replacement of replacements) {
      if (!source.includes(replacement.from)) {
        throw new Error(
          `Expected replacement source was not found in ${file}: ${replacement.from}`
        );
      }
      source = source.replaceAll(replacement.from, replacement.to);
    }

    await writeFile(target, source, 'utf8');
  }
}

async function writeBuildMetadata() {
  let sourceCommit = 'unknown';
  try {
    sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repositoryDir,
      encoding: 'utf8'
    }).trim();
  } catch {
    // Diagnostic metadata must not make packaging depend on git.
  }

  const metadata = {
    kind: config.kind,
    factoryVersion: config.factoryVersion,
    sourceRepository: config.source.repository,
    sourceCommit,
    productName: config.app.productName,
    binaryName: config.app.binaryName,
    generatedAt: new Date().toISOString(),
    protectionClaim: 'none'
  };

  const metadataPath = resolveWithin(
    outputDir,
    config.packaging.metadataFile,
    'packaging.metadataFile'
  );
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
}

await copyApplicationFiles();
await vendorDependencies();
await applyOfflineReplacements();
await writeBuildMetadata();

console.log(
  `Desktop Factory prepared ${config.app.productName} in ${outputDir} ` +
  `(${config.packaging.files.length} files, ` +
  `${config.packaging.directories.length} directories).`
);
