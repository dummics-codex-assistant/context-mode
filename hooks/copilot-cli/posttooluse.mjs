#!/usr/bin/env node
import "../suppress-stderr.mjs";
import "../ensure-deps.mjs";
/**
 * GitHub Copilot CLI postToolUse hook — session event capture.
 */

import { readStdin, parseStdin, getSessionId, getSessionDBPath, getInputProjectDir, COPILOT_CLI_OPTS } from "../session-helpers.mjs";
import { createSessionLoaders, attributeAndInsertEvents } from "../session-loaders.mjs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HOOK_DIR = dirname(fileURLToPath(import.meta.url));
const { loadSessionDB, loadExtract, loadProjectAttribution } = createSessionLoaders(HOOK_DIR);
const OPTS = COPILOT_CLI_OPTS;

function parseToolArgs(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string" || value.trim().length === 0) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return { raw: value };
  }
}

function stringifyResult(result) {
  if (typeof result?.textResultForLlm === "string") return result.textResultForLlm;
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result ?? "");
  } catch {
    return "";
  }
}

try {
  const raw = await readStdin();
  const input = parseStdin(raw);
  const projectDir = getInputProjectDir(input, OPTS);

  const { extractEvents } = await loadExtract();
  const { resolveProjectAttributions } = await loadProjectAttribution();
  const { SessionDB } = await loadSessionDB();

  const dbPath = getSessionDBPath(OPTS);
  const db = new SessionDB({ dbPath });
  const sessionId = getSessionId(input, OPTS);

  db.ensureSession(sessionId, projectDir);

  const normalizedInput = {
    tool_name: input.toolName ?? input.tool_name ?? "",
    tool_input: parseToolArgs(input.toolArgs ?? input.tool_input ?? {}),
    tool_response: stringifyResult(input.toolResult ?? input.tool_response),
    is_error: input.toolResult?.resultType === "failure",
  };

  const events = extractEvents(normalizedInput);
  attributeAndInsertEvents(db, sessionId, events, input, projectDir, "PostToolUse", resolveProjectAttributions);

  db.close();
} catch {
  // Copilot CLI ignores output here; never block the session.
}
