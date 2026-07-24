import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const desktopDir = resolve(scriptDir, '..');
export const repositoryDir = resolve(desktopDir, '..');
export const outputDir = resolve(desktopDir, 'app');
export const reportsDir = resolve(desktopDir, 'reports');

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
}

export function safeRelativePath(value, label) {
  requireString(value, label);
  if (isAbsolute(value) || value.includes('\0')) {
    throw new Error(`${label} must be a safe relative path.`);
  }

  const normalized = value.replaceAll('\\', '/');
  if (
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')
  ) {
    throw new Error(`${label} must not escape its base directory.`);
  }
  return normalized;
}

export function resolveWithin(baseDir, value, label) {
  const safe = safeRelativePath(value, label);
  const target = resolve(baseDir, safe);
  const rel = relative(baseDir, target);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`${label} resolves outside its base directory.`);
  }
  return target;
}

function validatePathArray(values, label) {
  requireArray(values, label);
  values.forEach((value, index) => safeRelativePath(value, `${label}[${index}]`));
}

function validateConfig(config) {
  requireObject(config, 'desktop-app.json');
  if (config.schemaVersion !== 1) {
    throw new Error(`Unsupported schemaVersion: ${config.schemaVersion}`);
  }

  requireString(config.factoryVersion, 'factoryVersion');
  requireObject(config.source, 'source');
  requireString(config.source.root, 'source.root');
  safeRelativePath(config.source.entrypoint, 'source.entrypoint');
  requireString(config.source.repository, 'source.repository');

  requireObject(config.app, 'app');
  for (const field of [
    'productName',
    'binaryName',
    'version',
    'identifier',
    'title',
    'description',
    'longDescription',
    'artifactName',
    'iconSource'
  ]) {
    requireString(config.app[field], `app.${field}`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(config.app.binaryName)) {
    throw new Error('app.binaryName must contain lowercase ASCII letters, numbers, or hyphens.');
  }
  requireArray(config.app.authors, 'app.authors');
  config.app.authors.forEach((author, index) =>
    requireString(author, `app.authors[${index}]`)
  );
  requireObject(config.app.window, 'app.window');
  for (const field of ['width', 'height', 'minWidth', 'minHeight']) {
    if (!Number.isFinite(config.app.window[field]) || config.app.window[field] <= 0) {
      throw new Error(`app.window.${field} must be a positive number.`);
    }
  }
  resolveWithin(desktopDir, config.app.iconSource, 'app.iconSource');

  requireObject(config.packaging, 'packaging');
  validatePathArray(config.packaging.files, 'packaging.files');
  validatePathArray(config.packaging.directories, 'packaging.directories');
  if (!config.packaging.files.includes(config.source.entrypoint)) {
    throw new Error('source.entrypoint must be present in packaging.files.');
  }
  safeRelativePath(config.packaging.metadataFile, 'packaging.metadataFile');
  requireArray(config.packaging.vendor, 'packaging.vendor');
  for (const [vendorIndex, vendor] of config.packaging.vendor.entries()) {
    requireObject(vendor, `packaging.vendor[${vendorIndex}]`);
    requireString(vendor.package, `packaging.vendor[${vendorIndex}].package`);
    if (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(vendor.package)) {
      throw new Error(`Invalid npm package name: ${vendor.package}`);
    }
    requireArray(vendor.copies, `packaging.vendor[${vendorIndex}].copies`);
    for (const [copyIndex, copy] of vendor.copies.entries()) {
      requireObject(copy, `packaging.vendor[${vendorIndex}].copies[${copyIndex}]`);
      safeRelativePath(
        copy.from,
        `packaging.vendor[${vendorIndex}].copies[${copyIndex}].from`
      );
      safeRelativePath(
        copy.to,
        `packaging.vendor[${vendorIndex}].copies[${copyIndex}].to`
      );
    }
  }

  requireArray(config.packaging.replacements, 'packaging.replacements');
  for (const [index, replacement] of config.packaging.replacements.entries()) {
    requireObject(replacement, `packaging.replacements[${index}]`);
    safeRelativePath(replacement.file, `packaging.replacements[${index}].file`);
    requireString(replacement.from, `packaging.replacements[${index}].from`);
    requireString(replacement.to, `packaging.replacements[${index}].to`);
  }

  requireObject(config.validation, 'validation');
  validatePathArray(config.validation.requiredFiles, 'validation.requiredFiles');
  validatePathArray(config.validation.forbiddenFiles, 'validation.forbiddenFiles');
  validatePathArray(config.validation.activeTextFiles, 'validation.activeTextFiles');
  validatePathArray(
    config.validation.parseInlineScripts ?? [],
    'validation.parseInlineScripts'
  );
  for (const ruleName of ['requiredText', 'forbiddenText']) {
    requireArray(config.validation[ruleName] ?? [], `validation.${ruleName}`);
    for (const [index, rule] of (config.validation[ruleName] ?? []).entries()) {
      requireObject(rule, `validation.${ruleName}[${index}]`);
      safeRelativePath(rule.file, `validation.${ruleName}[${index}].file`);
      requireString(rule.contains, `validation.${ruleName}[${index}].contains`);
    }
  }

  requireObject(config.exposureAudit ?? {}, 'exposureAudit');
  requireArray(config.exposureAudit?.markers ?? [], 'exposureAudit.markers');
  (config.exposureAudit?.markers ?? []).forEach((marker, index) =>
    requireString(marker, `exposureAudit.markers[${index}]`)
  );
}

export async function loadFactoryConfig() {
  const configPath = resolve(desktopDir, 'desktop-app.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  validateConfig(config);

  const sourceDir = resolve(desktopDir, config.source.root);
  const sourceRelative = relative(repositoryDir, sourceDir);
  if (
    sourceRelative === '..' ||
    sourceRelative.startsWith(`..${sep}`) ||
    isAbsolute(sourceRelative)
  ) {
    throw new Error('source.root must resolve inside the repository.');
  }

  return {
    config,
    configPath,
    sourceDir
  };
}
