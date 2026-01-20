import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface SyncChange {
  section: 'dependencies' | 'devDependencies';
  name: string;
  from?: string;
  to: string;
  source: string;
  type: 'added' | 'updated';
}

const SOURCES = [
  {
    name: 'ng-alain',
    url: 'https://raw.githubusercontent.com/ng-alain/ng-alain/refs/heads/master/package.json'
  },
  {
    name: 'delon',
    url: 'https://raw.githubusercontent.com/ng-alain/delon/refs/heads/master/package.json'
  }
] as const;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_PACKAGE_JSON = path.resolve(__dirname, '..', 'package.json');

async function fetchJson(url: string): Promise<PackageJson> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<PackageJson>;
}

function ensureSection(pkg: PackageJson, section: 'dependencies' | 'devDependencies'): void {
  if (!pkg[section]) {
    pkg[section] = {};
  }
}

async function main(): Promise<void> {
  const localText = await readFile(ROOT_PACKAGE_JSON, 'utf8');
  const localPkg = JSON.parse(localText) as PackageJson;

  const sources = await Promise.all(
    SOURCES.map(async source => ({
      name: source.name,
      pkg: await fetchJson(source.url)
    }))
  );

  const changes: SyncChange[] = [];

  for (const source of sources) {
    for (const section of ['dependencies', 'devDependencies'] as const) {
      const sourceDeps = source.pkg[section] ?? {};
      if (Object.keys(sourceDeps).length === 0) continue;

      ensureSection(localPkg, section);
      const targetDeps = localPkg[section] as Record<string, string>;

      for (const [name, version] of Object.entries(sourceDeps)) {
        const current = targetDeps[name];
        if (!current) {
          targetDeps[name] = version;
          changes.push({ section, name, to: version, source: source.name, type: 'added' });
        } else if (current !== version) {
          targetDeps[name] = version;
          changes.push({
            section,
            name,
            from: current,
            to: version,
            source: source.name,
            type: 'updated'
          });
        }
      }
    }
  }

  await writeFile(ROOT_PACKAGE_JSON, `${JSON.stringify(localPkg, null, 2)}\n`, 'utf8');

  const added = changes.filter(c => c.type === 'added').length;
  const updated = changes.filter(c => c.type === 'updated').length;

  console.log(`Sync done. Added: ${added}, Updated: ${updated}`);
  for (const change of changes) {
    if (change.type === 'added') {
      console.log(`[${change.section}] + ${change.name}@${change.to} (${change.source})`);
    } else {
      console.log(`[${change.section}] ~ ${change.name}: ${change.from} -> ${change.to} (${change.source})`);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
