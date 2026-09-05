# Changelog

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
