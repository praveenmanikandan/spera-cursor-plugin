import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const submission = process.argv.includes('--submission');
const failures = [];
const expectedSkills = [
  'spera-build-custom-node',
  'spera-build-module',
  'spera-build-strategy',
  'spera-deliver-strategy',
  'spera-foundations',
  'spera-run-backtest',
  'spera-update-project-knowledge',
  'spera-write-documentation',
];
const expectedScopes = [
  'spera:context:read',
  'spera:artifact:read',
  'spera:artifact:write',
  'spera:backtest:run',
  'spera:backtest:read',
  'spera:backtest:cancel',
  'spera:knowledge:read',
  'spera:knowledge:write',
  'spera:documentation:read',
  'spera:documentation:write',
];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function json(relative) {
  try {
    return JSON.parse(await readFile(path.join(root, relative), 'utf8'));
  } catch (error) {
    failures.push(`${relative}: ${error.message}`);
    return {};
  }
}

function safeRelative(value, label) {
  check(typeof value === 'string' && value.length > 0, `${label} must be a non-empty relative path`);
  if (typeof value !== 'string') return;
  check(!path.isAbsolute(value), `${label} must not be absolute`);
  check(!value.split(/[\\/]+/).includes('..'), `${label} must not escape the plugin root`);
}

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).replaceAll('\\', '/');
    const stat = await lstat(absolute);
    check(!stat.isSymbolicLink(), `${relative} must not be a symbolic link`);
    if (entry.isDirectory()) result.push(...(await walk(absolute)));
    else result.push({ absolute, relative });
  }
  return result;
}

const manifest = await json('.cursor-plugin/plugin.json');
check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name ?? ''), 'plugin name must be kebab-case');
check(/^\d+\.\d+\.\d+$/.test(manifest.version ?? ''), 'plugin version must be semver');
check(typeof manifest.description === 'string' && manifest.description.length >= 30, 'plugin description is too short');
check(manifest.author?.name === 'Spera', 'plugin author must be Spera');
check(manifest.author?.email === 'support@spera.bot', 'plugin support email is incorrect');
check(manifest.repository === 'https://github.com/praveenmanikandan/spera-cursor-plugin', 'repository URL is incorrect');
safeRelative(manifest.logo, 'logo');
safeRelative(manifest.skills, 'skills');
safeRelative(manifest.mcpServers, 'mcpServers');

const logo = await readFile(path.join(root, manifest.logo ?? 'missing')).catch(() => Buffer.alloc(0));
check(logo.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'logo must be a PNG');
if (logo.length >= 24) {
  const width = logo.readUInt32BE(16);
  const height = logo.readUInt32BE(20);
  check(width === height && width >= 256, 'logo must be square and at least 256px');
}

const mcp = await json(manifest.mcpServers ?? 'mcp.json');
const server = mcp.mcpServers?.spera;
check(server?.url === 'https://api.spera.bot/mcp', 'MCP URL must be the production HTTPS endpoint');
check(server?.headers?.['X-Spera-MCP-Mode'] === 'authoring', 'MCP mode header must be authoring');
check(Object.keys(server?.headers ?? {}).length === 1, 'MCP headers must not contain credentials or extra values');
check(JSON.stringify(server?.auth?.scopes) === JSON.stringify(expectedScopes), 'MCP OAuth scopes do not match the reviewed authoring profile');

const skillEntries = (await readdir(path.join(root, 'skills'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
check(JSON.stringify(skillEntries) === JSON.stringify(expectedSkills), 'skills directory contains missing or unexpected skills');
for (const skill of expectedSkills) {
  const content = await readFile(path.join(root, 'skills', skill, 'SKILL.md'), 'utf8').catch(() => '');
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1] ?? '';
  check(new RegExp(`^name:\\s*${skill}$`, 'mu').test(frontmatter), `${skill}: frontmatter name must match its directory`);
  check(/^description:\s*\S.+$/mu.test(frontmatter), `${skill}: frontmatter description is required`);
  check(!content.includes('localhost'), `${skill}: portable instructions must not reference localhost`);
}

const requiredDocs = ['README.md', 'SECURITY.md', 'DATA_HANDLING.md'];
for (const document of requiredDocs) {
  const content = await readFile(path.join(root, document), 'utf8').catch(() => '');
  check(content.length > 100, `${document} is missing or incomplete`);
}
const readme = await readFile(path.join(root, 'README.md'), 'utf8').catch(() => '');
for (const value of ['https://www.spera.bot/privacy', 'https://www.spera.bot/terms', 'support@spera.bot']) {
  check(readme.includes(value), `README.md must include ${value}`);
}

const files = await walk(root);
const secretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
  /\bgh[oprsu]_[A-Za-z0-9]{20,}\b/u,
  /\bsk-[A-Za-z0-9]{20,}\b/u,
  /\bAKIA[0-9A-Z]{16}\b/u,
];
for (const file of files) {
  if (file.relative.startsWith('.git/')) continue;
  if (file.relative !== 'assets/logo.png') {
    const content = await readFile(file.absolute, 'utf8').catch(() => '');
    for (const pattern of secretPatterns) check(!pattern.test(content), `${file.relative} appears to contain a secret`);
  }
}

if (submission) {
  check(typeof manifest.license === 'string' && manifest.license.length > 0, 'submission requires an approved open-source license in plugin.json');
  const license = await readFile(path.join(root, 'LICENSE'), 'utf8').catch(() => '');
  check(license.length > 100, 'submission requires a LICENSE file');
}

if (failures.length) {
  console.error(`Plugin validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Plugin validation passed${submission ? ' for submission' : ''}.`);
}
