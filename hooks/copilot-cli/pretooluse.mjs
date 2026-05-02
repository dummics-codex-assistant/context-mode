#!/usr/bin/env node
import "../suppress-stderr.mjs";
/**
 * GitHub Copilot CLI preToolUse hook for context-mode.
 *
 * Copilot CLI currently processes deny decisions only, so this hook is a
 * guardrail and logger-friendly router, not a prompt injection surface.
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readStdin } from "../core/stdin.mjs";
import { routePreToolUse, initSecurity } from "../core/routing.mjs";
import { formatDecision } from "../core/formatters.mjs";
import { parseStdin, getSessionId, getInputProjectDir, COPILOT_CLI_OPTS } from "../session-helpers.mjs";

const __hookDir = dirname(fileURLToPath(import.meta.url));
await initSecurity(resolve(__hookDir, "..", "..", "build"));

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

try {
  const raw = await readStdin();
  const input = parseStdin(raw);
  const tool = input.toolName ?? input.tool_name ?? "";
  const toolInput = parseToolArgs(input.toolArgs ?? input.tool_input ?? {});
  const projectDir = getInputProjectDir(input, COPILOT_CLI_OPTS);
  const sessionId = getSessionId(input, COPILOT_CLI_OPTS);

  const decision = routePreToolUse(tool, toolInput, projectDir, "copilot-cli", sessionId);
  const response = formatDecision("copilot-cli", decision);
  if (response !== null) {
    process.stdout.write(JSON.stringify(response) + "\n");
  }
} catch {
  // Hook must fail open.
}
