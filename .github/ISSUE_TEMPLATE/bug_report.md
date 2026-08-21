---
name: Bug report
about: Something in the Spera plugin or its MCP tools did not behave as documented
labels: bug
---

## What happened

<!-- One or two sentences. What did you ask for, what did you get? -->

## Client

- Client and version: <!-- e.g. Claude Code 2.1.140, Cursor 3.14.7, Codex CLI 0.147.0 -->
- Install method: <!-- /plugin install spera@spera, local path, Cursor plugin dir, Codex marketplace -->

## Evidence

Spera returns an id for everything it does. Pasting these turns a report into a lookup:

- Tool called: <!-- e.g. spera_strategy_patch -->
- Contract version and tool count from `spera_context_get`: <!-- e.g. 1.0, 31 tools -->
- Artifact id and revision: <!-- e.g. strategy 7c1f2a4e..., commit 21bf2eb2... -->
- Receipt id, if one was returned: <!-- e.g. artifact_compiled e724dc9e... -->
- Backtest job id, if applicable:
- Diagnostic code and message, verbatim:

## Expected

<!-- What the docs or the skill said should happen. -->

---

**Never paste** access tokens, client secrets, exchange API keys, or private strategy source you do not
want public. For anything sensitive, email support@spera.bot instead.
