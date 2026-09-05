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
for (const scope of ['openid', 'email']) {
  check(oauth.scopes_supported?.includes(scope), `OAuth server must advertise the ${scope} scope`);
}

// RFC 8414 path-inserted form. Connector clients that discover from the resource
// identifier ask for this one, not the root form, and a 404 here aborts discovery
// before the authorize step is ever reached.
const scopedOauthResponse = await request(`${issuer}/.well-known/oauth-authorization-server/mcp`);
check(scopedOauthResponse?.ok, 'the /mcp-scoped authorization-server document must resolve');

// OpenAI's submission rules require an identity layer: the discovery document, a
// verifiable key set, and a UserInfo endpoint that reports email_verified.
const oidcResponse = await request(`${issuer}/.well-known/openid-configuration`);
const oidc = oidcResponse?.ok ? await oidcResponse.json() : {};
check(oidc.issuer === issuer, `OIDC issuer must be ${issuer}`);
for (const endpoint of ['jwks_uri', 'userinfo_endpoint', 'authorization_endpoint', 'token_endpoint']) {
  check(typeof oidc[endpoint] === 'string' && oidc[endpoint].startsWith(`${issuer}/`), `OIDC ${endpoint} must be hosted on ${issuer}`);
}
const jwksResponse = oidc.jwks_uri ? await request(oidc.jwks_uri) : undefined;
const jwks = jwksResponse?.ok ? await jwksResponse.json() : {};
check(Array.isArray(jwks.keys) && jwks.keys.length > 0, 'the published JWKS must contain at least one signing key');

if (failures.length) {
  console.error(`Live smoke failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Live MCP and public-site smoke passed.');
}
