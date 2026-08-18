const issuer = 'https://api.spera.bot';
const resource = `${issuer}/mcp`;
const metadataUrl = `${issuer}/.well-known/oauth-protected-resource/mcp`;
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function request(url, options) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(15_000) });
  } catch (error) {
    failures.push(`${url}: ${error.message}`);
    return undefined;
  }
}

for (const url of [
  'https://github.com/praveenmanikandan/spera-cursor-plugin',
  'https://raw.githubusercontent.com/praveenmanikandan/spera-cursor-plugin/main/.cursor-plugin/plugin.json',
  'https://raw.githubusercontent.com/praveenmanikandan/spera-cursor-plugin/main/assets/logo.svg',
  'https://www.spera.bot/handbook',
  'https://www.spera.bot/privacy',
  'https://www.spera.bot/terms',
]) {
  const response = await request(url);
  check(response?.ok, `${url} must return HTTP 2xx`);
}

const protectedResponse = await request(resource);
check(protectedResponse?.status === 401, 'unauthenticated MCP request must return 401');
const challenge = protectedResponse?.headers.get('www-authenticate') ?? '';
check(challenge.includes(`resource_metadata="${metadataUrl}"`), `MCP challenge must advertise ${metadataUrl}`);

const metadataResponse = await request(metadataUrl);
const metadata = metadataResponse?.ok ? await metadataResponse.json() : {};
check(metadata.resource === resource, `protected-resource metadata must advertise ${resource}`);
check(JSON.stringify(metadata.authorization_servers) === JSON.stringify([issuer]), `protected-resource metadata must advertise only ${issuer}`);

const oauthResponse = await request(`${issuer}/.well-known/oauth-authorization-server`);
const oauth = oauthResponse?.ok ? await oauthResponse.json() : {};
check(oauth.issuer === issuer, `OAuth issuer must be ${issuer}`);
for (const endpoint of ['authorization_endpoint', 'token_endpoint', 'revocation_endpoint', 'registration_endpoint']) {
  check(typeof oauth[endpoint] === 'string' && oauth[endpoint].startsWith(`${issuer}/`), `${endpoint} must be hosted on ${issuer}`);
}
check(oauth.code_challenge_methods_supported?.includes('S256'), 'OAuth server must advertise PKCE S256');

if (failures.length) {
  console.error(`Live smoke failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Live MCP and public-site smoke passed.');
}
