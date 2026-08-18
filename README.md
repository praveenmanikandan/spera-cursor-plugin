# Spera for Cursor

Spera for Cursor packages the production Spera MCP server and its portable agent skills into one
installable plugin. It helps users create and revise strategy graphs, modules, and custom nodes; run
exact-revision backtests; and maintain project knowledge and artifact documentation.

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

The plugin connects to `https://api.spera.bot/mcp` over Streamable HTTP. On first use, Cursor opens
Spera's OAuth authorization flow. Sign in to Spera and approve only the scopes shown in the consent
screen. A complete authoring grant exposes 31 tools.

## Local testing

Copy or link this repository to Cursor's local plugin directory:

```text
~/.cursor/plugins/local/spera
```

Restart Cursor or run **Developer: Reload Window**, then open **Customize** and confirm that Spera's
skills and MCP server are listed. Complete OAuth and verify that `spera_context_get` reports the expected
scopes before testing write workflows.

Repository checks use Node.js 20 or newer and have no third-party dependencies:

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
