/**
 * Shared routing block for context-mode hooks.
 * Single source of truth — imported by pretooluse.mjs and sessionstart.mjs.
 *
 * Factory functions accept a tool namer `t(bareTool) => platformSpecificName`
 * so each platform gets correct tool names in guidance messages.
 *
 * Backward compat: static exports (ROUTING_BLOCK, READ_GUIDANCE, etc.)
 * default to Codex naming convention in this fork.
 */

import { createToolNamer } from "./core/tool-naming.mjs";

// ── Factory functions ─────────────────────────────────────

export function createRoutingBlock(t, options = {}) {
  const includeCommands = options.includeCommands !== false;
  return `
<context_window_protection>
  <priority_instructions>
    Output grezzo lungo consuma contesto utile. Usa context-mode quando serve davvero: log, transcript, scansioni grandi, JSONL, CI/test output voluminosi, web/documenti lunghi.
    Mantieni nel contesto solo sintesi, evidenza e path rilevanti. Non cambiare lingua, tono o priorita' operative dell'utente.
  </priority_instructions>

  <tool_selection_hierarchy>
    0. MEMORY: ${t("ctx_search")}(sort: "timeline")
       - Dopo resume/compact, cerca decisioni o vincoli gia' indicizzati prima di chiedere all'utente.
    1. GATHER: ${t("ctx_batch_execute")}(commands, queries)
       - Tool principale per discovery multi-comando. Esegue, indicizza e cerca in un solo giro.
       - Usa label descrittive: diventano titoli FTS5 e aiutano il recupero.
    2. FOLLOW-UP: ${t("ctx_search")}(queries: ["q1", "q2", ...])
       - Per domande successive su output gia' indicizzato.
    3. PROCESSING: ${t("ctx_execute")}(language, code) | ${t("ctx_execute_file")}(path, language, code)
       - Analisi computazionale, filtri, conteggi, parsing e sintesi. Stampa solo risultato utile.
  </tool_selection_hierarchy>

  <usage_guidance>
    - Per comandi brevi e mirati puoi usare gli strumenti normali.
    - Per output atteso sopra circa 20 righe, usa ${t("ctx_batch_execute")} o filtra con ${t("ctx_execute")}.
    - Per scouting docs/repo ampio, cataloghi, mapping di riferimenti o audit con molte ricerche, parti con ${t("ctx_batch_execute")}: raccogli file indice, rg mirati e poche letture chiave in un solo giro, poi usa ${t("ctx_search")} per follow-up.
    - Per leggere pochi file prima di editarli, lettura normale va bene.
    - Per analizzare file grandi, usa ${t("ctx_execute_file")}.
    - Per web/documenti lunghi, usa ${t("ctx_fetch_and_index")} e poi ${t("ctx_search")}.
    - Non ripetere un comando bloccato aggirando l'hook: riduci output, filtra o indicizza.
  </usage_guidance>

  <file_writing_policy>
    Usa gli strumenti nativi di Codex per creare o modificare file.
    ${t("ctx_execute")} e ${t("ctx_execute_file")} servono per analisi/processamento, non come writer primario.
  </file_writing_policy>

  <output_constraints>
    <communication_style>
      Mantieni lingua e tono definiti dalle istruzioni globali dell'owner.
      Sii compatto quando basta, espandi solo per rischi, verifiche, decisioni o confusione reale.
      context-mode non deve imporre stile telegrafico o output inglese.
    </communication_style>
    <artifact_policy>
      Se produci artifact lunghi, preferisci file. Per risposte brevi, chat normale va bene.
    </artifact_policy>
    <response_format>
      Riporta azioni, path, verifiche e blocker in modo proporzionato al task.
    </response_format>
  </output_constraints>
  <session_continuity>
    Skill, ruoli, decisioni e gate del thread restano validi finche' l'utente non li cambia.
    Dopo resume/compact, cerca contesto indicizzato se serve, ma non inventare stato.
  </session_continuity>
${includeCommands ? `
  <ctx_commands>
    "ctx stats" | "ctx-stats" | "/ctx-stats"
    -> Chiama stats MCP e mostra il risultato.

    "ctx doctor" | "ctx-doctor" | "/ctx-doctor"
    -> Chiama doctor MCP e riporta checklist.

    "ctx upgrade" | "ctx-upgrade" | "/ctx-upgrade"
    -> Aggiorna context-mode e richiede riavvio sessione.

    "ctx purge" | "ctx-purge" | "/ctx-purge"
    -> Irreversibile. Usalo solo su richiesta esplicita dell'owner.

    Dopo /clear o /compact: knowledge base preservata. Per ripartire da zero serve \`ctx purge\`.
  </ctx_commands>
` : ""}
</context_window_protection>`;
}

export function createReadGuidance(t) {
  return `<context_guidance>\\n  <tip>context-mode: letture grandi consumano contesto. Per analisi usa ${t("ctx_execute_file")}(path, language, code) e stampa solo cio' che serve. Lettura normale ok se devi editare.\\n  </tip>\\n</context_guidance>`;
}

export function createGrepGuidance(t) {
  return `<context_guidance>\\n  <tip>context-mode: le ricerche possono esplodere. Usa ${t("ctx_execute")} per filtrare l'output, oppure ${t("ctx_batch_execute")} con comando + query.\\n  </tip>\\n</context_guidance>`;
}

export function createBashGuidance(t) {
  return `<context_guidance>\\n  <tip>context-mode: output shell lungo consuma contesto. Usa ${t("ctx_batch_execute")} per discovery multi-step o ${t("ctx_execute")}(language: "shell", code: "...") per filtrare e stampare solo sintesi.\\n  </tip>\\n</context_guidance>`;
}

export function createDocsScoutingGuidance(t) {
  return `<context_guidance>\\n  <tip>context-mode: task di scouting docs/repo rilevato. Se devi cercare in molti file, usa prima ${t("ctx_batch_execute")}(commands, queries) con comandi bounded e label descrittive; poi ${t("ctx_search")}(queries) per follow-up. Usa letture normali solo dopo aver ridotto la shortlist.\\n  </tip>\\n</context_guidance>`;
}

// ── Backward compat: static exports defaulting to Codex ──

const _t = createToolNamer("codex");
export const ROUTING_BLOCK = createRoutingBlock(_t);
export const READ_GUIDANCE = createReadGuidance(_t);
export const GREP_GUIDANCE = createGrepGuidance(_t);
export const BASH_GUIDANCE = createBashGuidance(_t);
export const DOCS_SCOUTING_GUIDANCE = createDocsScoutingGuidance(_t);
