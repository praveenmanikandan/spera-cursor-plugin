---
description: Diagnose the Spera MCP connection — reachability, OAuth discovery, scopes, and grant state.
allowed-tools: Bash
---

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs"` and report each line.

It probes https://api.spera.bot/mcp?mode=authoring without a token: that anonymous discovery answers, that a
guarded method still challenges, that the three OAuth discovery documents resolve, and whether the
challenge carries all 10 authoring scopes. Override the target with
`SPERA_MCP_URL` when working against a local gateway.

Whether THIS client holds a grant is client-side state the script cannot see. If everything below
passes and tools are still missing, the answer is: authorize, then restart the client.
