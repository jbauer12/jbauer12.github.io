import { copyFile, cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = resolvePathArg('--source') ?? path.join(projectRoot, 'dist', 'basic-website', 'browser');
const targetDir = resolvePathArg('--target') ?? path.join(projectRoot, 'docs');
const preservedEntries = new Set(['.nojekyll', 'CNAME']);

await assertDirectoryExists(sourceDir);
await mkdir(targetDir, { recursive: true });
await clearDirectory(targetDir, preservedEntries);
await cp(sourceDir, targetDir, { recursive: true });
await writeFile(path.join(targetDir, '.nojekyll'), '');
await copyFile(path.join(targetDir, 'index.html'), path.join(targetDir, '404.html'));

console.log(`Synced ${path.relative(projectRoot, sourceDir)} -> ${path.relative(projectRoot, targetDir)}`);

async function assertDirectoryExists(directoryPath) {
  try {
    const details = await stat(directoryPath);
    if (!details.isDirectory()) {
      throw new Error();
    }
  } catch {
    throw new Error(`Build output directory not found: ${directoryPath}`);
  }
}

async function clearDirectory(directoryPath, keepNames) {
  const entries = await readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (keepNames.has(entry.name)) {
      continue;
    }

    await rm(path.join(directoryPath, entry.name), {
      force: true,
      recursive: true,
    });
  }
}

function resolvePathArg(flag) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return null;
  }

  const value = process.argv[index + 1];
  return value ? path.resolve(process.cwd(), value) : null;
}
