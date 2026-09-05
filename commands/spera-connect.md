---
description: Connect to Spera and confirm scopes, tools, and visible projects before authoring.
allowed-tools: Skill, Bash, mcp__spera__spera_context_get
---

Use the `spera-foundations` skill. Call `spera_context_get` with exactly `{}`, then report the
contract version, granted scopes, advertised tool count, and the projects this user can see.

If no Spera tool is reachable, run `/spera-doctor` and report what it found instead of stopping at
"not connected". The usual causes, in order:

1. Not authorized yet. Authorize the `spera` server, then RESTART the client — a grant obtained
   mid-session does not attach to a session already running.
2. Authorized against a different URL. Each URL is a separate OAuth resource with its own grant.
   This plugin uses https://api.spera.bot/mcp?mode=authoring.
3. A read-only grant. The `?mode=authoring` suffix is what makes the server challenge for
   authoring scopes; the `X-Spera-MCP-Mode` header says the same thing for clients that forward it,
   but many connector UIs drop custom headers. Authorized against the bare URL, every authoring call
   fails with 403 insufficient_scope.

Never guess identifiers, and never deploy or operate bots.
