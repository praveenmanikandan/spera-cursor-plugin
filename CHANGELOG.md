# Changelog

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
