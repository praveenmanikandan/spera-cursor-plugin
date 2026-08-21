import { inflateSync } from 'node:zlib';
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
const agentPluginSchema = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const agentMcpSchema = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';
const portableManifestFields = new Set([
  '$schema',
  'name',
  'version',
  'description',
  'author',
  'homepage',
  'repository',
  'license',
  'keywords',
  'extensions',
]);

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

function paeth(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

function validateTransparentPng(buffer, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  check(buffer.subarray(0, 8).equals(signature), `${label} must be a PNG`);
  if (!buffer.subarray(0, 8).equals(signature)) return;

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat = [];
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += length + 12;
  }

  check(width === 512 && height === 512, `${label} must be exactly 512x512`);
  check(bitDepth === 8 && colorType === 6 && interlace === 0, `${label} must be a non-interlaced 8-bit RGBA PNG`);
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0 || width === 0 || height === 0) return;

  const packed = inflateSync(Buffer.concat(idat));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const previous = Buffer.alloc(stride);
  let cursor = 0;
  let hasTransparentPixel = false;
  for (let y = 0; y < height; y += 1) {
    const filter = packed[cursor];
    cursor += 1;
    const row = Buffer.alloc(stride);
    for (let x = 0; x < stride; x += 1) {
      const encoded = packed[cursor + x];
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
      const up = previous[x];
      const upperLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;
      const predictor =
        filter === 0 ? 0
          : filter === 1 ? left
            : filter === 2 ? up
              : filter === 3 ? Math.floor((left + up) / 2)
                : filter === 4 ? paeth(left, up, upperLeft)
                  : Number.NaN;
      check(Number.isFinite(predictor), `${label} uses an unsupported PNG filter`);
      if (!Number.isFinite(predictor)) return;
      row[x] = (encoded + predictor) & 0xff;
    }
    for (let alpha = 3; alpha < stride; alpha += bytesPerPixel) {
      if (row[alpha] < 255) hasTransparentPixel = true;
    }
    row.copy(previous);
    cursor += stride;
  }
  check(hasTransparentPixel, `${label} must have a transparent background`);
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

const portableManifest = await json('plugin.json');
check(portableManifest.$schema === agentPluginSchema, 'plugin.json must target Agent Plugins 1.0.0');
check(
  Object.keys(portableManifest).every((field) => portableManifestFields.has(field)),
  'plugin.json contains fields outside the closed Agent Plugins schema',
);
check(/^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(portableManifest.name ?? ''), 'portable plugin name is invalid');
check((portableManifest.name ?? '').length <= 64, 'portable plugin name exceeds 64 characters');
check(/^\d+\.\d+\.\d+$/.test(portableManifest.version ?? ''), 'portable plugin version must be semver');
check(typeof portableManifest.description === 'string' && portableManifest.description.length >= 30, 'portable plugin description is too short');
check(portableManifest.author?.name === 'SPERO SPERA PRIVATE LIMITED', 'portable plugin developer identity is incorrect');
check(portableManifest.author?.email === 'support@spera.bot', 'portable plugin support email is incorrect');
check(portableManifest.author?.url === 'https://www.spera.bot', 'portable plugin author URL is incorrect');
check(Object.keys(portableManifest.author ?? {}).every((field) => ['name', 'email', 'url'].includes(field)), 'portable plugin author contains unsupported fields');
check(portableManifest.repository === 'https://github.com/praveenmanikandan/spera-cursor-plugin', 'portable repository URL is incorrect');
check(portableManifest.license === 'MIT', 'portable plugin license must be MIT');

const portableMcp = await json('mcp.json');
check(portableMcp.$schema === agentMcpSchema, 'mcp.json must target Agent Plugins 1.0.0');
check(
  Object.keys(portableMcp).every((field) => ['$schema', 'mcpServers'].includes(field)),
  'mcp.json contains fields outside the closed Agent Plugins schema',
);
const portableServer = portableMcp.mcpServers?.spera;
check(Object.keys(portableMcp.mcpServers ?? {}).length === 1, 'portable MCP config must contain exactly one server');
check(portableServer?.type === 'streamable-http', 'portable MCP transport must be streamable-http');
check(portableServer?.url === 'https://api.spera.bot/mcp', 'portable MCP URL must be the production HTTPS endpoint');
check(portableServer?.headers?.['X-Spera-MCP-Mode'] === 'authoring', 'portable MCP mode header must be authoring');
check(Object.keys(portableServer?.headers ?? {}).length === 1, 'portable MCP headers must not contain credentials or extra values');
check(
  Object.keys(portableServer ?? {}).every((field) => ['type', 'url', 'headers'].includes(field)),
  'portable MCP server contains unsupported or client-specific fields',
);

const manifest = await json('.cursor-plugin/plugin.json');
check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name ?? ''), 'Cursor plugin name must be kebab-case');
check(/^\d+\.\d+\.\d+$/.test(manifest.version ?? ''), 'Cursor plugin version must be semver');
check(typeof manifest.description === 'string' && manifest.description.length >= 30, 'Cursor plugin description is too short');
check(manifest.name === portableManifest.name, 'Cursor and portable plugin names must match');
check(manifest.version === portableManifest.version, 'Cursor and portable plugin versions must match');
check(manifest.license === portableManifest.license, 'Cursor and portable plugin licenses must match');
check(manifest.author?.name === 'Spera', 'Cursor plugin author must be Spera');
check(manifest.author?.email === 'support@spera.bot', 'Cursor plugin support email is incorrect');
check(manifest.repository === portableManifest.repository, 'Cursor and portable repository URLs must match');
safeRelative(manifest.logo, 'Cursor logo');
safeRelative(manifest.skills, 'Cursor skills');
safeRelative(manifest.mcpServers, 'Cursor mcpServers');

const codexManifest = await json('.codex-plugin/plugin.json');
check(codexManifest.name === manifest.name, 'Codex and Cursor plugin names must match');
check(codexManifest.version === manifest.version, 'Codex and Cursor plugin versions must match');
check(codexManifest.license === manifest.license, 'Codex and Cursor plugin licenses must match');
check(codexManifest.repository === manifest.repository, 'Codex and Cursor repository URLs must match');
check(codexManifest.author?.name === 'SPERO SPERA PRIVATE LIMITED', 'Codex developer identity is incorrect');
check(codexManifest.author?.email === 'support@spera.bot', 'Codex support email is incorrect');
check(codexManifest.skills === './skills/', 'Codex skills path must be ./skills/');
check(codexManifest.apps === './.app.json', 'Codex app path must be ./.app.json');
check(!('mcpServers' in codexManifest), 'Codex must use the registered Spera app instead of bundling a second MCP connection');
check(codexManifest.interface?.displayName === 'Spera', 'Codex display name must be Spera');
check(codexManifest.interface?.developerName === 'SPERO SPERA PRIVATE LIMITED', 'Codex developer name is incorrect');
check(codexManifest.interface?.category === 'Productivity', 'Codex category must be Productivity');
check(
  JSON.stringify(codexManifest.interface?.capabilities) === JSON.stringify(['Read', 'Write', 'Interactive']),
  'Codex capabilities must match the reviewed MCP behavior',
);
check(codexManifest.interface?.websiteURL === 'https://www.spera.bot', 'Codex website URL is incorrect');
check(codexManifest.interface?.privacyPolicyURL === 'https://www.spera.bot/privacy', 'Codex privacy URL is incorrect');
check(codexManifest.interface?.termsOfServiceURL === 'https://www.spera.bot/terms', 'Codex terms URL is incorrect');
check(/^#[0-9A-F]{6}$/u.test(codexManifest.interface?.brandColor ?? ''), 'Codex brand color must be a hex color');
check(
  Array.isArray(codexManifest.interface?.defaultPrompt) && codexManifest.interface.defaultPrompt.length === 3
    && codexManifest.interface.defaultPrompt.every((prompt) => typeof prompt === 'string' && prompt.length <= 128),
  'Codex must provide exactly three starter prompts of at most 128 characters',
);
for (const [field, relative] of [
  ['composerIcon', codexManifest.interface?.composerIcon],
  ['logo', codexManifest.interface?.logo],
]) {
  safeRelative(relative, `Codex ${field}`);
  const asset = await readFile(path.join(root, relative ?? 'missing')).catch(() => Buffer.alloc(0));
  validateTransparentPng(asset, `Codex ${field}`);
}

const claudeManifest = await json('.claude-plugin/plugin.json');
check(claudeManifest.$schema === 'https://json.schemastore.org/claude-code-plugin-manifest.json', 'Claude manifest must declare the Claude Code plugin schema');
check(!('displayName' in claudeManifest), 'Claude manifest must omit displayName: `claude plugin tag` rejects it as an unrecognized key');
check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(claudeManifest.name ?? ''), 'Claude plugin name must be kebab-case');
check(claudeManifest.name === manifest.name, 'Claude and Cursor plugin names must match');
check(claudeManifest.version === manifest.version, 'Claude and Cursor plugin versions must match');
check(claudeManifest.license === manifest.license, 'Claude and Cursor plugin licenses must match');
check(claudeManifest.repository === manifest.repository, 'Claude and Cursor repository URLs must match');
check(typeof claudeManifest.description === 'string' && claudeManifest.description.length >= 30, 'Claude plugin description is too short');
check(claudeManifest.author?.name === 'SPERO SPERA PRIVATE LIMITED', 'Claude developer identity is incorrect');
check(claudeManifest.author?.email === 'support@spera.bot', 'Claude support email is incorrect');
check(claudeManifest.author?.url === 'https://www.spera.bot', 'Claude author URL is incorrect');
check(claudeManifest.skills === './skills/', 'Claude skills path must be ./skills/');
safeRelative(claudeManifest.skills, 'Claude skills');
check(claudeManifest.mcpServers === './.claude-plugin/mcp.json', 'Claude MCP path must be ./.claude-plugin/mcp.json');
safeRelative(claudeManifest.mcpServers, 'Claude mcpServers');
const claudeMcp = await json('.claude-plugin/mcp.json');
check(
  Object.keys(claudeMcp).every((field) => field === 'mcpServers'),
  'Claude MCP config must contain only mcpServers',
);
const claudeServer = claudeMcp.mcpServers?.spera;
check(Object.keys(claudeMcp.mcpServers ?? {}).length === 1, 'Claude plugin must declare exactly one MCP server');
check(claudeServer?.type === 'http', 'Claude MCP transport must be http');
check(claudeServer?.url === portableServer?.url, 'Claude and portable MCP URLs must match');
check(claudeServer?.headers?.['X-Spera-MCP-Mode'] === 'authoring', 'Claude MCP mode header must be authoring');
check(Object.keys(claudeServer?.headers ?? {}).length === 1, 'Claude MCP headers must not contain credentials or extra values');
check(
  Object.keys(claudeServer ?? {}).every((field) => ['type', 'url', 'headers'].includes(field)),
  'Claude MCP server contains unsupported fields',
);

const claudeMarketplace = await json('.claude-plugin/marketplace.json');
check(claudeMarketplace.name === 'spera', 'Claude marketplace name must be spera');
check(claudeMarketplace.owner?.name === 'SPERO SPERA PRIVATE LIMITED', 'Claude marketplace owner identity is incorrect');
check(claudeMarketplace.owner?.email === 'support@spera.bot', 'Claude marketplace support email is incorrect');
check(Array.isArray(claudeMarketplace.plugins) && claudeMarketplace.plugins.length === 1, 'Claude marketplace must list exactly one plugin');
const claudeEntry = claudeMarketplace.plugins?.[0] ?? {};
check(claudeEntry.name === claudeManifest.name, 'Claude marketplace entry name must match the plugin');
check(claudeEntry.version === claudeManifest.version, 'Claude marketplace entry version must match the plugin');
check(claudeEntry.license === claudeManifest.license, 'Claude marketplace entry license must match the plugin');
check(claudeEntry.source === './', 'Claude marketplace entry must install this repository');
check(typeof claudeEntry.description === 'string' && claudeEntry.description.length >= 30, 'Claude marketplace entry description is too short');

const logoPath = path.join(root, manifest.logo ?? 'missing');
const logo = await readFile(logoPath).catch(() => Buffer.alloc(0));
if (manifest.logo?.endsWith('.svg')) {
  const svg = logo.toString('utf8');
  check(/<svg\b/u.test(svg), 'logo must be a valid SVG document');
  check(/width="512"\s+height="512"/u.test(svg), 'SVG logo must declare a square 512px canvas');
  check(!/<rect\b/u.test(svg), 'SVG logo must not contain a background plate');
  check((svg.match(/<path\b[^>]+fill="#FDC238"/gu) ?? []).length === 5, 'SVG logo must preserve all five approved yellow paths');
} else {
  check(logo.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'logo must be an SVG or PNG');
  if (logo.length >= 24) {
    const width = logo.readUInt32BE(16);
    const height = logo.readUInt32BE(20);
    check(width === height && width >= 256, 'logo must be square and at least 256px');
  }
}

const mcp = await json(manifest.mcpServers ?? 'mcp.json');
const server = mcp.mcpServers?.spera;
check(server?.url === portableServer?.url, 'Cursor and portable MCP URLs must match');
check(server?.type === portableServer?.type, 'Cursor and portable MCP transports must match');
check(server?.headers?.['X-Spera-MCP-Mode'] === 'authoring', 'Cursor MCP mode header must be authoring');
check(Object.keys(server?.headers ?? {}).length === 1, 'Cursor MCP headers must not contain credentials or extra values');

const codexApps = await json(codexManifest.apps ?? '.app.json');
check(
  JSON.stringify(Object.keys(codexApps.apps ?? {})) === JSON.stringify(['spera']),
  'Codex .app.json must contain exactly the registered Spera app',
);
const codexApp = codexApps.apps?.spera;
check(codexApp?.id === 'asdk_app_6a8437fecfec819181eda17dc8faa4c8', 'Codex app ID must match the reviewed Spera app');
check(Object.keys(codexApp ?? {}).every((field) => field === 'id'), 'Codex app mapping contains unsupported fields');

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
  if (!file.relative.startsWith('assets/logo.')) {
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
