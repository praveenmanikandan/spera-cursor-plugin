---
name: spera-deliver-strategy
description: Deliver a verified Spera strategy across authoring, exact-revision backtesting, project knowledge, and artifact documentation through the remote Spera MCP server. Use when Claude Code, Codex, or Cursor must complete a strategy handoff with durable cross-client continuity and evidence receipts. Composes the dedicated Spera skills and stops before deployment or bot lifecycle actions.
metadata:
  spera-contract: ">=1.0 <2.0"
---

# Deliver a Spera strategy

Read and follow `spera-foundations`, `spera-build-strategy`, `spera-run-backtest`,
`spera-update-project-knowledge`, and `spera-write-documentation`. Use only the parts required by the
user's delivery request.

## Deliver through one durable workflow

1. Establish the explicit project, exact strategy ID, workflow ID, and granted scopes. Resume an existing
   workflow after a client change or reconnect; never recreate a successfully persisted artifact.
2. Build or repair one strategy draft in place until its exact revision has an `artifact_compiled`
   receipt. When the requested delivery names a pair, market, and timeframe, pass that intended
   workspace context as create-time `chartSettings`. Stop on the builder's typed budget or terminal rule.
3. If requested, run a bounded backtest for that exact compiled commit. Deep starts still pass the full
   pair and explicit market/timeframe; the first accepted deep job fills missing chart context but later
   jobs do not overwrite it. Preserve settings, dataset, job,
   pagination, and `backtest_completed` receipt. Do not imply live or forward performance.
4. Research the manifest before project content. Apply ordinary knowledge once, or propose and obtain
   explicit acceptance for `STRATEGY.md`. Keep revision-pinned citations and receipts.
5. Read then apply exact artifact documentation once. Include compile/backtest statements only when the
   same workflow contains the matching receipts and the document names their receipt IDs.

## Handoff and stop

Return exact project/artifact IDs, branch and commit, workflow ID, document and documentation revisions,
backtest job/configuration when used, citations, and every persistence/compile/backtest/documentation
receipt. State any unverified claims or omitted steps plainly.

Delivery ends at a documented, optionally backtested strategy. Never start, stop, pause, resume, or
deploy a bot; operate Fleet; access exchange credentials; or perform paper/live trading lifecycle work.
