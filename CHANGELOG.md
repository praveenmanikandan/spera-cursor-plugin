# Changelog

## 1.1.2 - 2026-09-16

- **Cursor can sign in.** Cursor desktop decides a server needs sign-in only from a `401` on
  `initialize`. The server answered a tokenless `initialize` with `200` for anonymous discovery, so
  Cursor showed the `spera` server as **Error** and never offered **Authenticate**. The server now
  challenges any tokenless request that carries `X-Spera-MCP-Mode`, which every `mcp.json` in this
  repository sends; requests by URL alone (ChatGPT connectors, tool scanners) still get anonymous
  discovery. No manifest URL changes: the header stays in every MCP config and is now load-bearing.
- `scripts/doctor.mjs` probes anonymous discovery without the header and adds a **sign-in trigger**
  probe that expects `401` on `initialize` with it; `/spera-doctor` describes the new probe.
- Sync four skills with the current server: branch-addressed reads (`version: { branchId }`) in
  `spera-build-strategy`, `spera-foundations`, and `spera-run-backtest`; research studies and the
  Spera-only research discipline in `spera-foundations`, `spera-run-backtest`, and
  `spera-deliver-strategy`; and result cards in `spera-foundations`.
- README: Cursor Directory install and the Authenticate step, the header's role in sign-in, and the
  current 42-tool count.
- Versions move from 1.1.0 to 1.1.2 to match the canonical profile; 1.1.1 was never published.

## 1.1.0 - 2026-09-05

- **Declare the authoring URL.** Every manifest now points at
  `https://api.spera.bot/mcp?mode=authoring` instead of the bare endpoint plus an
  `X-Spera-MCP-Mode` header. Connector interfaces routinely drop custom headers, so the header alone
  negotiated a read-only grant and every authoring tool then failed with `403 insufficient_scope`
  after an OAuth flow that had otherwise succeeded. The header is still sent for clients that
  forward it; the two now agree. This is what the OpenAI app review was configured to hit.
- Correct the submission validator, which asserted the bare URL and would have rejected the fix.
- Teach `scripts/doctor.mjs` the server's current contract: `initialize` is now answered without a
  token so app-store tool scanners can enumerate the catalogue, so the doctor checks that anonymous
  discovery *succeeds* and reads the scope challenge from a guarded method instead. It previously
  demanded a 401 on `initialize` and would have reported FAIL against a correctly working server.
- Add the OAuth identity layer to the live smoke test: `openid` and `email` in `scopes_supported`,
  the RFC 8414 path-inserted authorization-server document, the OpenID configuration, and a
  non-empty JWKS.
- Sync `spera-run-backtest` with the current server: optional `backtestSettings` and the reported
  `settingsSource`, `spera_strategy_settings_set`, the `edge` results section, and the non-terminal
  Edge Check poll.
- Ship the `/spera-connect` and `/spera-doctor` commands with the plugin.

## 1.0.0 - 2026-08-21

- Add the Claude Code adapter: `.claude-plugin/plugin.json`, `.claude-plugin/mcp.json`, and a
  single-plugin marketplace so users install with `/plugin marketplace add` and `/plugin install`.
- Rewrite the README around installation per client, the ten OAuth scopes, the measured context cost,
  and an explicit list of what the plugin deliberately cannot do.
- Make the data-handling commitment client-neutral rather than Cursor-specific.
- Extend the submission validator to cover the Claude manifests.

## 1.0.0 - 2026-08-20 (initial packaging)

- Add the vendor-neutral Agent Plugins 1.0.0 manifest and Streamable HTTP MCP configuration.
- Publish eight portable Spera Agent Skills.
- Preserve Cursor and ChatGPT/Codex compatibility manifests.
- Add transparent marketplace icons and cross-format submission validation.
