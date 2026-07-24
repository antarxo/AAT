import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { desktopDir, loadFactoryConfig } from './factory-config.mjs';

const { config } = await loadFactoryConfig();
const tauriCli = resolve(
  desktopDir,
  'node_modules',
  '@tauri-apps',
  'cli',
  'tauri.js'
);
const iconSource = resolve(desktopDir, config.app.iconSource);

execFileSync(process.execPath, [tauriCli, 'icon', iconSource], {
  cwd: desktopDir,
  stdio: 'inherit'
});
