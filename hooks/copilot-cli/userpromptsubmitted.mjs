#!/usr/bin/env node
import "../suppress-stderr.mjs";
import "../ensure-deps.mjs";
/**
 * GitHub Copilot CLI userPromptSubmitted hook — capture user prompts.
 *
 * Copilot CLI ignores hook output for this event, so this is continuity only.
 */

import { readStdin, parseStdin, getSessionId, getSessionDBPath, getInputProjectDir, COPILOT_CLI_OPTS } from "../session-helpers.mjs";
import { createSessionLoaders, attributeAndInsertEvents } from "../session-loaders.mjs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HOOK_DIR = dirname(fileURLToPath(import.meta.url));
const { loadSessionDB, loadExtract, loadProjectAttribution } = createSessionLoaders(HOOK_DIR);
const OPTS = COPILOT_CLI_OPTS;

try {
  const raw = await readStdin();
  const input = parseStdin(raw);
  const projectDir = getInputProjectDir(input, OPTS);
  const prompt = input.prompt ?? input.initialPrompt ?? input.message ?? "";
  const trimmed = (prompt || "").trim();

  if (trimmed.length > 0) {
    const { SessionDB } = await loadSessionDB();
    const { extractUserEvents } = await loadExtract();
    const { resolveProjectAttributions } = await loadProjectAttribution();
    const dbPath = getSessionDBPath(OPTS);
    const db = new SessionDB({ dbPath });
    const sessionId = getSessionId(input, OPTS);

    db.ensureSession(sessionId, projectDir);

    const promptEvent = {
      type: "user_prompt",
      category: "user-prompt",
      data: prompt,
      priority: 1,
    };
    const promptAttributions = attributeAndInsertEvents(
      db, sessionId, [promptEvent], input, projectDir, "UserPromptSubmit", resolveProjectAttributions,
    );

    const userEvents = extractUserEvents(trimmed);
    const savedLastKnown = promptAttributions[0]?.projectDir || null;
    const sessionStats = db.getSessionStats(sessionId);
    const lastKnownProjectDir = typeof db.getLatestAttributedProjectDir === "function"
      ? db.getLatestAttributedProjectDir(sessionId)
      : null;
    const userAttributions = resolveProjectAttributions(userEvents, {
      sessionOriginDir: sessionStats?.project_dir || projectDir,
      inputProjectDir: projectDir,
      workspaceRoots: Array.isArray(input.workspace_roots) ? input.workspace_roots : [],
      lastKnownProjectDir: savedLastKnown || lastKnownProjectDir,
    });
    for (let i = 0; i < userEvents.length; i++) {
      db.insertEvent(sessionId, userEvents[i], "UserPromptSubmit", userAttributions[i]);
    }

    db.close();
  }
} catch {
  // Hook must fail open.
}
