import { access, readFile, readdir } from 'node:fs/promises';
import { loadFactoryConfig, outputDir, resolveWithin } from './factory-config.mjs';

const { config } = await loadFactoryConfig();

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

for (const file of config.validation.requiredFiles) {
  const path = resolveWithin(outputDir, file, `required file ${file}`);
  if (!(await exists(path))) {
    throw new Error(`Required runtime file is missing: ${file}`);
  }
}

for (const file of config.validation.forbiddenFiles) {
  const path = resolveWithin(outputDir, file, `forbidden file ${file}`);
  if (await exists(path)) {
    throw new Error(`Legacy/non-runtime file was packaged unexpectedly: ${file}`);
  }
}

const textByFile = new Map();
for (const file of config.validation.activeTextFiles) {
  const path = resolveWithin(outputDir, file, `active text file ${file}`);
  textByFile.set(file, await readFile(path, 'utf8'));
}

for (const rule of config.validation.requiredText ?? []) {
  const text = textByFile.get(rule.file) ??
    await readFile(resolveWithin(outputDir, rule.file, `required text file ${rule.file}`), 'utf8');
  if (!text.includes(rule.contains)) {
    throw new Error(`Required text is missing from ${rule.file}: ${rule.contains}`);
  }
}

for (const rule of config.validation.forbiddenText ?? []) {
  const text = textByFile.get(rule.file) ??
    await readFile(resolveWithin(outputDir, rule.file, `forbidden text file ${rule.file}`), 'utf8');
  if (text.includes(rule.contains)) {
    throw new Error(`Forbidden text remains in ${rule.file}: ${rule.contains}`);
  }
}

if (config.validation.networkPolicy === 'offline') {
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
}

let parsedInlineScripts = 0;
for (const file of config.validation.parseInlineScripts ?? []) {
  const text = textByFile.get(file) ??
    await readFile(resolveWithin(outputDir, file, `inline script file ${file}`), 'utf8');
  for (const match of text.matchAll(
    /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
  )) {
    // Syntax-only parse. Browser globals are intentionally not executed here.
    new Function(match[1]);
    parsedInlineScripts += 1;
  }
}

const rootEntries = await readdir(outputDir);
console.log(
  `Desktop Factory check passed for ${config.app.productName} ` +
  `(${config.validation.requiredFiles.length} required files, ` +
  `${parsedInlineScripts} inline scripts, ${rootEntries.length} root entries).`
);
