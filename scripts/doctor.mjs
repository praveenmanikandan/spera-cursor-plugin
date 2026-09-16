#!/usr/bin/env node
// Spera MCP connection doctor (plugin edition).
//
// Unauthenticated probes only: this never reads, writes, or transmits a token.
// The repository ships a fuller version at scripts/agents/mcp-preflight.mjs that
// also audits every client registration on the machine.
// The authoring URL, matching mcp.json — not the bare one. A doctor that probed a
// different URL than the manifest declares would pass while the registration the
// user actually installed came back read-only.
const URL_UNDER_TEST = process.env.SPERA_MCP_URL ?? "https://api.spera.bot/mcp?mode=authoring";
const MODE = "authoring";
const AUTHORING_SCOPES = ["spera:context:read","spera:artifact:read","spera:artifact:write","spera:backtest:run","spera:backtest:read","spera:backtest:cancel","spera:knowledge:read","spera:knowledge:write","spera:documentation:read","spera:documentation:write"];

const line = (level, label, detail, fix) =>
  console.log(
    `[${level.padEnd(4)}] ${label.padEnd(26)} ${detail}` + (fix ? `\n         -> ${fix}` : ""),
  );

async function post(url, headers, method, params = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    return res;
  } catch (error) {
    return { failed: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

const scopesOf = (header) => (/scope="([^"]*)"/.exec(header ?? "")?.[1] ?? "").split(/\s+/).filter(Boolean);

let failures = 0;
const fail = (...args) => { failures += 1; line("FAIL", ...args); };

console.log(`Spera MCP doctor — ${URL_UNDER_TEST}\n`);

// Probe 1 — discovery. `initialize` is answered WITHOUT a token so that app-store
// tool scanners can enumerate the catalogue before any grant exists. Scanners cannot
// send custom headers, so this probe sends none. A 401 here means a scanner would
// see nothing but the challenge.
const discovery = await post(URL_UNDER_TEST, {}, "initialize");
if (discovery.failed) {
  fail("reachable", discovery.failed, URL_UNDER_TEST.includes("localhost")
    ? "start the Spera API gateway, or unset SPERA_MCP_URL to use the hosted server"
    : "check network access to the Spera API");
} else if (discovery.status === 401) {
  fail("anonymous discovery", `${URL_UNDER_TEST} → 401 on initialize`,
    "this server still guards discovery; a tool scanner sees only the challenge");
} else if (discovery.ok) {
  line("OK", "anonymous discovery", `${URL_UNDER_TEST} → ${discovery.status} on initialize`);
} else {
  fail("anonymous discovery", `${URL_UNDER_TEST} → ${discovery.status} (expected 200)`);
}

// Probe 1b — sign-in trigger. This plugin's mcp.json sends the mode header, and
// clients such as Cursor only offer Authenticate when `initialize` is challenged.
if (!discovery.failed) {
  const native = await post(URL_UNDER_TEST, { "X-Spera-MCP-Mode": MODE }, "initialize");
  if (native.failed) {
    fail("sign-in trigger", native.failed, "check network access to the Spera API");
  } else if (native.status !== 401) {
    fail("sign-in trigger", `initialize with the mode header → ${native.status} (expected 401)`,
      "the client will look connected but never offer Authenticate");
  } else {
    line("OK", "sign-in trigger", "initialize with the mode header → 401");
  }
}

// Probe 2 — the challenge. Discovery is open, so the scope advertisement has to be
// read from a method that still requires a token. `prompts/get` is deliberately
// excluded from the anonymous set and reads nothing, so it 401s before any dispatch.
const guarded = await post(URL_UNDER_TEST, { "X-Spera-MCP-Mode": MODE }, "prompts/get", { name: "spera-foundations" });
if (guarded.failed) {
  fail("auth challenge", guarded.failed, "check network access to the Spera API");
} else if (guarded.status !== 401) {
  fail("auth challenge", `guarded method → ${guarded.status} (expected 401)`,
    "a method that reads skill bodies must not be served without a token");
} else {
  const challenge = guarded.headers.get("www-authenticate");
  if (!challenge) {
    fail("auth challenge", "401 without WWW-Authenticate", "clients cannot discover the resource");
  } else {
    line("OK", "auth challenge", "WWW-Authenticate present");
    const scopes = scopesOf(challenge);
    const missing = AUTHORING_SCOPES.filter((s) => !scopes.includes(s));
    if (missing.length > 0) {
      fail("authoring scopes", `challenge omits ${missing.join(", ")}`,
        `the registration must use ${URL_UNDER_TEST}, or the grant comes back read-only`);
    } else {
      line("OK", "authoring scopes", `challenge requests all ${scopes.length} scopes`);
    }
  }
}

const origin = new URL(URL_UNDER_TEST).origin;
for (const [label, path] of [
  ["resource metadata", "/.well-known/oauth-protected-resource"],
  ["authorization server", "/.well-known/oauth-authorization-server"],
  ["openid configuration", "/.well-known/openid-configuration"],
]) {
  try {
    const meta = await fetch(origin + path);
    if (meta.ok) line("OK", label, path);
    else fail(label, `${path} → ${meta.status}`, "OAuth discovery is incomplete");
  } catch (error) {
    fail(label, String(error), "OAuth discovery is unreachable");
  }
}

console.log(
  "\n[NOTE] Whether this client holds a grant is client-side and cannot be checked here.\n"
  + "       If the checks pass but Spera tools are missing: authorize, then RESTART the client.",
);
process.exit(failures === 0 ? 0 : 1);
