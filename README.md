# Spera Agent Plugin

Spera packages its production MCP server and eight portable Agent Skills as an
[Agent Plugin](https://agent-plugins.org/). The portable core works in conforming clients, while the
repository retains compatibility adapters for Cursor and ChatGPT/Codex. It helps users create and
revise strategy graphs, modules, and custom nodes; run exact-revision backtests; and maintain project
knowledge and artifact documentation.

## Package layout

- `plugin.json` and `mcp.json`: vendor-neutral Agent Plugins 1.0.0 manifests.
- `skills/`: portable Agent Skills shared by every compatible client.
- `.cursor-plugin/plugin.json`: compatibility metadata for the existing Cursor listing.
- `.codex-plugin/plugin.json` and `.app.json`: ChatGPT/Codex packaging and the registered Spera app mapping.
- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`: Claude Code packaging and the
  single-plugin marketplace entry.

The portable package contains no access token, client secret, exchange credential, or user data.
Agent Plugins 1.0.0 leaves OAuth to the client; each client discovers and runs Spera's authorization
flow when the MCP connection is enabled.

## Capabilities

- Discover authorized Spera projects and artifacts.
- Create, branch, edit, and compile strategies.
- Create and configure reusable modules.
- Create, patch, and compile structured custom nodes.
- Run bounded quick and durable deep backtests.
- Read and update project knowledge with revision-safe citations.
- Read and update strategy, module, and custom-node documentation.

The plugin does not deploy live trading bots, manage exchange credentials, or authorize live trading.
Backtest results are historical evidence for an exact revision, not a performance guarantee.

## Connect

The plugin connects to `https://api.spera.bot/mcp` over Streamable HTTP. On first use, a supported
client opens Spera's OAuth authorization flow. Sign in to Spera and approve only the scopes shown in
the consent screen. A complete authoring grant exposes 31 tools.

## Local testing

### Agent Plugins clients

Install this repository using the Agent Plugin workflow supported by your client. Clients currently
implement their own installation UI and OAuth storage; consult the client's plugin documentation for
the exact installation command or marketplace.

### Cursor

Copy or link this repository to Cursor's local plugin directory:

```text
~/.cursor/plugins/local/spera
```

Restart Cursor or run **Developer: Reload Window**, then open **Customize** and confirm that Spera's
skills and MCP server are listed. Complete OAuth and verify that `spera_context_get` reports the expected
scopes before testing write workflows.

### Codex

The repository root contains `.codex-plugin/plugin.json`, the Codex `.app.json` mapping to Spera's
registered OpenAI app, the eight portable skills, and transparent 512×512 PNG marketplace assets.
Point a local Codex marketplace entry at this repository, install `spera` from that marketplace, and
start a new task so Codex loads the plugin's skills and registered app connection.

### Claude Code

The repository root contains `.claude-plugin/plugin.json` (metadata, the `skills/` path, and the
production Streamable HTTP MCP connection) and `.claude-plugin/marketplace.json` (a single-plugin
marketplace). Install it with:

```
/plugin marketplace add praveenmanikandan/spera-cursor-plugin
/plugin install spera@spera
```

Claude Code then loads the eight portable skills and registers the `spera` MCP server; complete OAuth
in the browser tab it opens. A local clone can be added the same way by passing its path to
`/plugin marketplace add`.

Repository checks use Node.js 20 or newer and have no third-party dependencies. `npm test` validates
the closed Agent Plugins manifests, Cursor and OpenAI compatibility manifests, the MCP profiles,
portable skills, documentation, secret hygiene, and the Codex PNG dimensions and transparency:

```text
npm test
npm run test:live
npm run validate:submission
```

`test:live` validates the public MCP OAuth discovery chain. `validate:submission` additionally requires
an approved open-source license before marketplace submission.

## Data handling, privacy, and support

- Data handling: [DATA_HANDLING.md](DATA_HANDLING.md)
- Privacy policy: https://www.spera.bot/privacy
- Terms of service: https://www.spera.bot/terms
- Support: support@spera.bot

Never include access tokens, exchange credentials, or private keys in prompts, issues, or support
requests.
