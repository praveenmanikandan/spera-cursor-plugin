# Spera Agent Plugin

Build, backtest, and document algorithmic trading strategies from your coding agent. Spera packages its
production MCP server and eight portable Agent Skills as an [Agent Plugin](https://agent-plugins.org/),
with compatibility adapters for **Claude Code**, **Cursor**, and **ChatGPT/Codex**. The same skills and
the same MCP server back every client, so a workflow you learn in one carries over to the next.

## Install

### Claude Code

```
/plugin marketplace add praveenmanikandan/spera-cursor-plugin
/plugin install spera@spera
```

If the install summary says `Run /reload-plugins to activate.`, run that. Then authenticate:

```
/mcp
```

Select **spera**, choose **Authenticate**, and approve the scopes on Spera's consent screen. Verify with
`/spera:spera-foundations` or by asking Claude to call `spera_context_get` — a complete grant reports
contract `1.0`, 10 scopes, and 31 tools.

Skills are namespaced by the plugin, so they invoke as `/spera:spera-build-strategy`,
`/spera:spera-run-backtest`, and so on. The names match the Cursor and Codex packages deliberately: a
workflow you know in one client is the same workflow here.

### Cursor

Copy or link this repository into Cursor's local plugin directory:

```text
~/.cursor/plugins/local/spera
```

Restart Cursor or run **Developer: Reload Window**, then open **Customize** and confirm Spera's skills
and MCP server are listed.

### ChatGPT / Codex

The repository root contains `.codex-plugin/plugin.json`, the Codex `.app.json` mapping to Spera's
registered OpenAI app, the eight portable skills, and transparent 512×512 PNG marketplace assets. Point
a local Codex marketplace entry at this repository, install `spera` from it, and start a new task.

### Other Agent Plugins clients

`plugin.json` and `mcp.json` at the repository root are vendor-neutral Agent Plugins 1.0.0 manifests.
Install through whatever workflow your client supports; clients own their installation UI and OAuth
token storage.

## What you get

Eight skills that teach the agent the correct order of operations, the recovery paths, and the stopping
rules — not just the tool schemas:

| Skill | What it does |
| --- | --- |
| `spera-foundations` | Connect, inspect authorized projects, resume durable workflows, enforce revision/receipt rules |
| `spera-build-strategy` | Create, edit, fork, repair, and compile strategy graphs |
| `spera-build-module` | Build reusable graph modules and publish their ports |
| `spera-build-custom-node` | Author, compile, and repair Rust/Wasm custom nodes |
| `spera-run-backtest` | Quick and durable deep backtests against an exact revision |
| `spera-update-project-knowledge` | Revision-safe project Markdown, with protected `STRATEGY.md` proposals |
| `spera-write-documentation` | Receipt-grounded artifact documentation |
| `spera-deliver-strategy` | Compose the above into a documented, backtested handoff |

A complete authoring grant exposes **31 MCP tools**.

**Context cost:** roughly 865 tokens of always-on context across the eight skills; each skill costs more
only when it actually fires. Claude Code shows this in the plugin details view before you install.

## Scopes it requests

`spera:context:read`, `spera:artifact:read`, `spera:artifact:write`, `spera:backtest:run`,
`spera:backtest:read`, `spera:backtest:cancel`, `spera:knowledge:read`, `spera:knowledge:write`,
`spera:documentation:read`, `spera:documentation:write`.

Approve only what the consent screen shows. Adding scopes later requires you to reauthorize.

## What it deliberately cannot do

There is **no tool at any scope** that can:

- create, start, stop, pause, or deploy a paper or live trading bot
- operate Fleet
- read or use exchange API credentials
- place, modify, or cancel a real order

Bots are started by a person in the Spera app. A compile receipt proves a strategy is structurally
valid; a backtest receipt is historical evidence for one exact revision under one exact configuration.
Neither is a performance promise, and neither authorizes deployment.

## Connection

The plugin connects to `https://api.spera.bot/mcp` over Streamable HTTP with the header
`X-Spera-MCP-Mode: authoring`. This repository contains no access token, client secret, or exchange
credential — OAuth is run by your client and the resulting authorization is stored by your client.

## Trust and updates

Claude Code shows a trust warning when you add any third-party marketplace: Anthropic does not verify
third-party plugins. This repository is the full source of what gets installed — the manifests, the MCP
endpoint, and all eight skill files are readable above.

Third-party marketplaces have auto-update **off** by default. To pick up new versions, either enable
auto-update for the `spera` marketplace in `/plugin` → **Marketplaces**, or refresh manually:

```
/plugin marketplace update spera
```

## Repository layout

- `plugin.json`, `mcp.json` — vendor-neutral Agent Plugins 1.0.0 manifests
- `skills/` — the eight portable Agent Skills, shared by every client
- `.claude-plugin/` — Claude Code manifest, MCP server file, and single-plugin marketplace
- `.cursor-plugin/plugin.json` — Cursor listing metadata
- `.codex-plugin/plugin.json`, `.app.json` — Codex packaging and registered app mapping

Every file above is generated from one canonical profile in the Spera repository, so the clients cannot
drift apart.

## Repository checks

Node.js 20 or newer, no third-party dependencies:

```text
npm test
npm run test:live
npm run validate:submission
```

`npm test` validates every manifest, the MCP profiles, the portable skills, documentation, secret
hygiene, and the Codex PNG dimensions and transparency. `test:live` exercises the public MCP OAuth
discovery chain. `validate:submission` additionally requires an approved open-source license.

Claude Code users can also run its own validator against a clone:

```bash
claude plugin validate .
```

## Data handling, privacy, and support

- Data handling: [DATA_HANDLING.md](DATA_HANDLING.md)
- Security policy: [SECURITY.md](SECURITY.md)
- Privacy policy: https://www.spera.bot/privacy
- Terms of service: https://www.spera.bot/terms
- Support and bug reports: support@spera.bot, or open an issue on this repository

Never include access tokens, exchange credentials, or private keys in prompts, issues, or support
requests.
