#!/usr/bin/env node
import "../suppress-stderr.mjs";
import "../ensure-deps.mjs";
/**
 * GitHub Copilot CLI sessionStart hook for context-mode.
 *
 * Copilot CLI ignores hook output for sessionStart, so routing instructions
 * live in the Copilot skill. This hook only prepares continuity storage.
 */

import {
  readStdin,
  parseStdin,
  getSessionId,
  getSessionDBPath,
  getSessionEventsPath,
  getCleanupFlagPath,
  getInputProjectDir,
  COPILOT_CLI_OPTS,
} from "../session-helpers.mjs";
import { createSessionLoaders } from "../session-loaders.mjs";
import { unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HOOK_DIR = fileURLToPath(new URL(".", import.meta.url));
const { loadSessionDB } = createSessionLoaders(HOOK_DIR);
const OPTS = COPILOT_CLI_OPTS;

try {
  const raw = await readStdin();
  const input = parseStdin(raw);
  const source = input.source ?? "startup";
  const projectDir = getInputProjectDir(input, OPTS);

  const { SessionDB } = await loadSessionDB();
  const dbPath = getSessionDBPath(OPTS);
  const db = new SessionDB({ dbPath });
  const sessionId = getSessionId(input, OPTS);

  if (source === "resume") {
    try { unlinkSync(getCleanupFlagPath(OPTS)); } catch { /* no flag */ }
  } else if (source === "startup" || source === "new") {
    try { unlinkSync(getSessionEventsPath(OPTS)); } catch { /* no stale file */ }
    db.cleanupOldSessions(7);
    db.db.exec(`DELETE FROM session_events WHERE session_id NOT IN (SELECT session_id FROM session_meta)`);
  }

  db.ensureSession(sessionId, projectDir);
  db.close();
} catch {
  // Hook must fail open.
}
