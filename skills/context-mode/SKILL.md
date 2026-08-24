---
name: context-mode
description: "Use context-mode for genuinely large or noisy outputs, broad multi-source research, long logs/transcripts, structured-data analysis, or repeated retrieval over indexed content. Keep targeted local search, folder/project discovery, short listings, and a few file reads on native tools."
---

# Context Mode

Context-mode protects the conversation from large raw payloads. It is an escalation path for volume and repeated analysis, not the default wrapper for every command.

## Native Tools First

Use normal shell, search, and read tools for bounded local work, including:

- targeted `rg`, `rg --files`, filename searches, and small result sets;
- locating folders, Unity projects, `ProjectSettings/ProjectVersion.txt`, or known project markers;
- short `Get-ChildItem`, `dir`, `ls`, `git status`, and bounded diffs;
- reading a few small, already-identified files;
- commands whose useful output is predictably compact, even if a small filter or count is involved;
- file edits and other host filesystem mutations.

Do not use context-mode merely because an operation searches, lists, reads, or uses a pipe. For one or two lightweight commands, native execution is normally faster and clearer.

## Escalate To Context-Mode

Use context-mode when at least one of these is true:

- raw output is likely to be large or unpredictable;
- the task spans many files, repositories, documents, APIs, or independent commands;
- you need substantial parsing, aggregation, comparison, deduplication, or repeated queries;
- logs, test/CI output, JSONL, transcripts, browser snapshots, or structured datasets would otherwise enter the conversation in bulk;
- web pages or long documents should be indexed and queried;
- resume/compaction requires searching captured session history.

When uncertain, first run the narrowest native command with explicit paths, filters, depth, limits, or selected fields. Escalate only if that evidence is insufficient or noisy.

## Tool Routing

- `ctx_batch_execute`: broad multi-command or multi-source gathering with combined noisy output. Avoid it for one or two small local searches.
- `ctx_execute`: substantial processing of large or unpredictable command/API output. Print only the derived result.
- `ctx_execute_file`: analyze a large file without loading it raw. Native Read remains correct for editing or a few small files.
- `ctx_index`: store long, reusable documents or already-identified directories for repeated retrieval.
- `ctx_search`: query indexed material or session memory. It does not search the live filesystem.
- `ctx_fetch_and_index`: fetch and index long web/document content.

For file writes use native edit/write tools. Context-mode subprocesses are analysis surfaces, not primary writers.

## Hooks

Hooks may redirect deterministic context floods such as raw web fetches or very verbose build tools. They must not reroute targeted grep/search, Unity-project discovery, folder lookup, or other bounded local operations merely because those operations could theoretically return many rows.

If a native search proves unexpectedly noisy, narrow it with paths, patterns, depth, limits, or selected fields; then escalate to context-mode only if useful evidence still requires broad processing.

## Session Continuity

After resume or compaction, use `ctx_search(sort: "timeline")` for prior decisions, blockers, summaries, or user corrections before asking the user to repeat them. Treat retrieved memory as context, not as current proof when the underlying state can drift.

## User Commands

- `ctx stats`: show context-mode statistics.
- `ctx doctor`: diagnose installation and integration.
- `ctx upgrade`: update context-mode, then restart the session.
- `ctx purge`: irreversible; use only on explicit user request.
