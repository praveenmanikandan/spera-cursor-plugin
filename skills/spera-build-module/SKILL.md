---
name: spera-build-module
description: Create, edit, fork, repair, compile, and configure reusable Spera graph modules through the remote Spera MCP server. Use when a user asks Claude Code, Codex, or Cursor to build or modify a Spera module. Requires spera-foundations, exact revisions, repair-in-place, and module ports only after a clean compile; never deploys or operates bots.
---

# Build a Spera module

Read and follow `spera-foundations` first. A module is complete only after its graph compiles and its
exact input/output contract is persisted.

## Build or edit

1. Call `spera_context_get` for the exact project and retain `workflowId` plus `stateToken`.
2. Read the compact node catalog, then batch exact details only for selected node types.
3. For an edit, resolve and read one exact module ID. If `projectIds` contains multiple projects, pass
   the intended project to `spera_artifact_get`; use its returned `projectId` and current revision for
   every mutation. If it is read-only, fork only when the user asked to edit it and continue on the
   returned owned ID.
4. Call `spera_module_create` or `spera_module_patch` with the minimum graph operations and a fresh
   idempotency key. Every `add_node` payload includes `id`, `type`, `category`, and `config`; every
   `add_edge` payload includes `id`, `source`, `target`, and exact catalog port handles when wiring.
5. Repair validation or compile diagnostics in place exactly as directed. A validation correction uses
   the returned state token and a fresh idempotency key; only a byte-identical replay reuses the original
   key. Never recreate the module or consume retries on a repeated byte-equivalent patch.

## Configure ports and finish

1. Continue only when the graph result is compile-clean and explicitly allows
   `spera_module_ports_set`.
2. Send the complete input and output arrays against the exact compiled module revision. Every output
   must name an existing internal node and exact output handle; every fallback node must exist.
3. On a stale revision, refresh rather than overwrite. On invalid ports, correct only the named port.
4. Stop at the terminal result. Retain its complete `artifact.moduleReference` and port arrays as the
   only supported strategy-embedding contract. `moduleReference` is ready to copy into a module node's
   `config`; its `moduleVersion` is the semantic/draft version, not the artifact revision or commit ID.
   Report the owned module ID, module version, final revision, and verified compile receipt.

Never configure ports before a clean compile, infer handles from display names, or attempt bot, Fleet,
deployment, trading, backtest, custom-node, Project Knowledge, or documentation operations.
