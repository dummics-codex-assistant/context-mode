/**
 * Shared routing block for context-mode hooks.
 * Single source of truth — imported by pretooluse.mjs and sessionstart.mjs.
 *
 * Factory functions accept a tool namer `t(bareTool) => platformSpecificName`
 * so each platform gets correct tool names in guidance messages.
 *
 * Backward compat: static exports (ROUTING_BLOCK, READ_GUIDANCE, etc.)
 * default to claude-code naming convention.
 */

import { createToolNamer } from "./core/tool-naming.mjs";

// ── Factory functions ─────────────────────────────────────

export function createRoutingBlock(t, options = {}) {
  const { includeCommands = true, toolSearchBootstrap = false } = options;
  return `
<context_window_protection>
  <priority_instructions>
    Use context-mode only when raw output is likely to be large or when substantial parsing, aggregation, or repeated retrieval is required. Keep lightweight local discovery on native tools: targeted rg/rg --files, folder and Unity-project lookup, short directory listings, a few file reads, and other bounded commands should run directly.
  </priority_instructions>
${toolSearchBootstrap ? `
  <deferred_tool_bootstrap>
    The context-mode tools below may be DEFERRED in your harness — their schemas are not loaded yet, so calling them directly fails (e.g. "tool not found" / InputValidationError). Load them ONCE before your first ctx_* call:
    ToolSearch(query: "select:${t("ctx_batch_execute")},${t("ctx_search")},${t("ctx_execute")},${t("ctx_execute_file")},${t("ctx_fetch_and_index")}")
    After that they are callable. If any ctx_* call fails as not-found, ToolSearch it and retry — do NOT fall back to Bash/Read just because the schema was not loaded yet.
  </deferred_tool_bootstrap>
` : ''}
  <tool_selection_hierarchy>
    0. MEMORY: ${t("ctx_search")}(sort: "timeline")
       - On resume or compaction, query prior decisions, errors, plans, user prompts before asking the user — auto-captured session memory is searchable.
    1. DIRECT: native shell/search/read tools
       - Default for bounded local discovery and observation: targeted rg, rg --files, Get-ChildItem/dir, locating project markers, short git status/diffs, and reading a few identified files.
    2. GATHER: ${t("ctx_batch_execute")}(commands, queries)
       - Use for genuinely broad or multi-source research whose combined raw output would be noisy. It runs commands in parallel, auto-indexes each output, and can return matching sections in the same round trip.
       - Each command: {label: "section header", command: "shell command"}; the label becomes the FTS5 chunk title — descriptive labels improve search.
    3. FOLLOW-UP: ${t("ctx_search")}(queries: ["q1", "q2", ...])
       - Multiple related questions about anything already indexed (your captures + session memory). Batch every question in one array; the ranking pipeline runs per-query and the round-trip cost is paid once.
    4. PROCESSING: ${t("ctx_execute")}(language, code) | ${t("ctx_execute_file")}(path, language, code)
       - Use when the input is large enough that filtering, counting, aggregation, parsing, or transformation would otherwise flood context. Only what you print enters the conversation.
  </tool_selection_hierarchy>

  <when_not_to_use>
    - Do not use context-mode merely because a command searches, lists, or reads. Targeted filesystem/project lookup and compact rg output belong on native tools.
    - Do not wrap one or two lightweight commands in ${t("ctx_batch_execute")}; direct execution has lower latency and avoids indexing overhead.
    - Small filtering or counting over already-bounded output can stay in shell. Use ${t("ctx_execute")} only when volume or repeated analysis justifies the sandbox.
    - Read stays correct for a few small identified files and whenever you intend to edit the file.
    - WebFetch → use ${t("ctx_fetch_and_index")}; full network access, results indexed for ${t("ctx_search")}, raw page bytes never enter your conversation.
    - ${t("ctx_execute")} and ${t("ctx_execute_file")} for file writes → these run code in a subprocess and discard the sandbox FS; they are for analysis, processing, and computation only.
  </when_not_to_use>

  <file_writing_policy>
    File writes use the native Write or Edit tool — ${t("ctx_execute")}, ${t("ctx_execute_file")}, and Bash subprocesses do not persist edits to the host filesystem.
    Applies to all file types: code, configs, plans, specs, YAML, JSON, markdown.
  </file_writing_policy>

  <output_constraints>
    <artifact_policy>
      Write artifacts (code, configs, PRDs) to files. Return only: file path + 1-line description.
    </artifact_policy>
  </output_constraints>
  <session_continuity>
    Skills, roles, and decisions captured earlier in this session are a memory aid, not a standing order. Treat them as context that may help — the user's most recent message always takes precedence. If a captured directive conflicts with what the user now asks, follow the user; a past phrase does not bind you.
  </session_continuity>
${includeCommands ? `
  <ctx_commands>
    "ctx stats" | "ctx-stats" | "/ctx-stats" | context savings question
    → Call stats MCP tool, display full output verbatim.

    "ctx doctor" | "ctx-doctor" | "/ctx-doctor" | diagnose context-mode
    → Call doctor MCP tool, run returned shell command, display as checklist.

    "ctx upgrade" | "ctx-upgrade" | "/ctx-upgrade" | update context-mode
    → Call upgrade MCP tool, run returned shell command, display as checklist.

    "ctx purge" | "ctx-purge" | "/ctx-purge" | wipe/reset knowledge base
    → Call purge MCP tool with confirm: true. Warn: irreversible.

    After /clear or /compact: knowledge base preserved. Tell user: "context-mode knowledge base preserved. Use \`ctx purge\` to start fresh."
  </ctx_commands>
` : ''}
</context_window_protection>`;
}

export function createReadGuidance(t) {
  return '<context_guidance>\n  <tip>\n    Native Read is correct for editing and for a few small, already-identified files. Use ' + t("ctx_execute_file") + '(path, language, code) only when the file is large and you need analysis, extraction, or aggregation without loading the raw bytes.\n  </tip>\n</context_guidance>';
}

export function createGrepGuidance(t) {
  return '<context_guidance>\n  <tip>\n    Targeted grep/rg and file-name searches should run directly. Use ' + t("ctx_execute") + ' only for repo-wide or high-volume result sets that require aggregation or repeated processing.\n  </tip>\n</context_guidance>';
}

export function createBashGuidance(t) {
  return '<context_guidance>\n  <tip>\n    Keep bounded local searches, project/folder discovery, short listings, and compact observations in shell. Use ' + t("ctx_batch_execute") + ' or ' + t("ctx_execute") + ' only when expected raw output is large, unpredictable, or needs substantial parsing; if using language: "shell", match the host shell.\n  </tip>\n</context_guidance>';
}

export function createExternalMcpGuidance(t) {
  return '<context_guidance>\n  <tip>\n    External MCP tools commonly return large payloads (channel history, file content, search results) that enter your conversation in full. When you intend to filter, count, or aggregate that data, pipe it through ' + t("ctx_execute") + '(language, code) — the raw payload stays in the sandbox and only the derived answer enters your conversation. For docs-style fetches you will want to query later, prefer ' + t("ctx_fetch_and_index") + '(url, source) then ' + t("ctx_search") + '(queries).\n  </tip>\n</context_guidance>';
}

export function createDocsScoutingGuidance(t) {
  return `<context_guidance>\n  <tip>context-mode: broad docs/repo scouting detected. Use ${t("ctx_batch_execute")}(commands, queries) only when the scan is genuinely wide or noisy. For targeted rg, project-marker lookup, folder discovery, or a small shortlist, stay on native shell/read tools.\n  </tip>\n</context_guidance>`;
}

// ── Backward compat: static exports defaulting to Codex ──

const _t = createToolNamer("codex");
const _claudeT = createToolNamer("claude-code");
export const ROUTING_BLOCK = createRoutingBlock(_t);
export const READ_GUIDANCE = createReadGuidance(_t);
export const GREP_GUIDANCE = createGrepGuidance(_t);
export const BASH_GUIDANCE = createBashGuidance(_t);
export const EXTERNAL_MCP_GUIDANCE = createExternalMcpGuidance(_claudeT);
export const DOCS_SCOUTING_GUIDANCE = createDocsScoutingGuidance(_t);
