/**
 * adapters/copilot-cli — GitHub Copilot CLI platform adapter.
 *
 * Copilot CLI hook specifics:
 *   - Hook config: ~/.copilot/settings.json or repository .github/hooks/*.json
 *   - Events: sessionStart, userPromptSubmitted, preToolUse, postToolUse, sessionEnd, errorOccurred
 *   - Only preToolUse deny decisions are currently processed
 *   - Session/prompt/tool-result hook outputs are ignored, so routing instructions live in skills
 */

import {
  accessSync,
  constants,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

import { BaseAdapter } from "../base.js";
import {
  buildNodeCommand,
  type DiagnosticResult,
  type HookAdapter,
  type HookParadigm,
  type HookRegistration,
  type PlatformCapabilities,
  type PostToolUseEvent,
  type PostToolUseResponse,
  type PreCompactEvent,
  type PreCompactResponse,
  type PreToolUseEvent,
  type PreToolUseResponse,
  type SessionStartEvent,
  type SessionStartResponse,
} from "../types.js";

interface CopilotCLIHookInput {
  timestamp?: number;
  cwd?: string;
  source?: string;
  initialPrompt?: string;
  prompt?: string;
  toolName?: string;
  toolArgs?: string | Record<string, unknown>;
  toolResult?: {
    resultType?: "success" | "failure" | "denied";
    textResultForLlm?: string;
  };
  sessionId?: string;
  session_id?: string;
}

function parseToolArgs(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  if (typeof value !== "string" || value.trim().length === 0) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return { raw: value };
  }
}

export class CopilotCLIAdapter extends BaseAdapter implements HookAdapter {
  constructor() {
    super([".copilot"]);
  }

  readonly name = "GitHub Copilot CLI";
  readonly paradigm: HookParadigm = "json-stdio";

  readonly capabilities: PlatformCapabilities = {
    preToolUse: true,
    postToolUse: true,
    preCompact: false,
    sessionStart: true,
    canModifyArgs: false,
    canModifyOutput: false,
    canInjectSessionContext: false,
  };

  parsePreToolUseInput(raw: unknown): PreToolUseEvent {
    const input = raw as CopilotCLIHookInput;
    return {
      toolName: input.toolName ?? "",
      toolInput: parseToolArgs(input.toolArgs),
      sessionId: this.extractSessionId(input),
      projectDir: input.cwd,
      raw,
    };
  }

  parsePostToolUseInput(raw: unknown): PostToolUseEvent {
    const input = raw as CopilotCLIHookInput;
    return {
      toolName: input.toolName ?? "",
      toolInput: parseToolArgs(input.toolArgs),
      toolOutput: input.toolResult?.textResultForLlm,
      isError: input.toolResult?.resultType === "failure",
      sessionId: this.extractSessionId(input),
      projectDir: input.cwd,
      raw,
    };
  }

  parsePreCompactInput(raw: unknown): PreCompactEvent {
    const input = raw as CopilotCLIHookInput;
    return {
      sessionId: this.extractSessionId(input),
      projectDir: input.cwd,
      raw,
    };
  }

  parseSessionStartInput(raw: unknown): SessionStartEvent {
    const input = raw as CopilotCLIHookInput;
    const rawSource = input.source ?? "startup";
    const source = rawSource === "resume" ? "resume" : "startup";
    return {
      sessionId: this.extractSessionId(input),
      source,
      projectDir: input.cwd,
      raw,
    };
  }

  formatPreToolUseResponse(response: PreToolUseResponse): unknown {
    if (response.decision === "deny") {
      return {
        permissionDecision: "deny",
        permissionDecisionReason: response.reason ?? "Blocked by context-mode hook",
      };
    }
    if (response.decision === "ask") {
      return {
        permissionDecision: "ask",
        permissionDecisionReason: response.reason ?? "Action requires user confirmation",
      };
    }
    return undefined;
  }

  formatPostToolUseResponse(_response: PostToolUseResponse): unknown {
    return undefined;
  }

  formatPreCompactResponse(_response: PreCompactResponse): unknown {
    return undefined;
  }

  formatSessionStartResponse(_response: SessionStartResponse): unknown {
    return undefined;
  }

  getSettingsPath(): string {
    return resolve(homedir(), ".copilot", "settings.json");
  }

  getMcpConfigPath(): string {
    return resolve(homedir(), ".copilot", "mcp-config.json");
  }

  generateHookConfig(pluginRoot: string): HookRegistration {
    const hook = (event: string) => [{
      matcher: "",
      hooks: [{
        type: "command",
        command: buildNodeCommand(`${pluginRoot}/hooks/copilot-cli/${event}.mjs`),
      }],
    }];
    return {
      sessionStart: hook("sessionstart"),
      userPromptSubmitted: hook("userpromptsubmitted"),
      preToolUse: hook("pretooluse"),
      postToolUse: hook("posttooluse"),
      sessionEnd: hook("sessionend"),
    };
  }

  readSettings(): Record<string, unknown> | null {
    try {
      const raw = readFileSync(this.getSettingsPath(), "utf-8");
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  writeSettings(settings: Record<string, unknown>): void {
    const configPath = this.getSettingsPath();
    mkdirSync(resolve(homedir(), ".copilot"), { recursive: true });
    writeFileSync(configPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
  }

  validateHooks(_pluginRoot: string): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];
    try {
      const raw = readFileSync(this.getSettingsPath(), "utf-8");
      const config = JSON.parse(raw) as Record<string, unknown>;
      const hooks = config.hooks as Record<string, unknown> | undefined;

      for (const event of ["sessionStart", "userPromptSubmitted", "preToolUse", "postToolUse", "sessionEnd"]) {
        const entries = hooks?.[event] as Array<Record<string, unknown>> | undefined;
        const configured = entries?.some((entry) =>
          JSON.stringify(entry).includes("context-mode") &&
          JSON.stringify(entry).includes("copilot-cli"),
        );
        results.push({
          check: `${event} hook`,
          status: configured ? "pass" : "fail",
          message: configured
            ? `${event} context-mode hook configured`
            : `${event} context-mode hook missing`,
          fix: "context-mode upgrade",
        });
      }
    } catch {
      results.push({
        check: "Hook configuration",
        status: "fail",
        message: "Could not read ~/.copilot/settings.json",
        fix: "context-mode upgrade",
      });
    }

    results.push({
      check: "Hook output support",
      status: "warn",
      message: "Copilot CLI currently processes deny decisions only; routing instructions are provided through the context-mode skill.",
    });

    return results;
  }

  checkPluginRegistration(): DiagnosticResult {
    try {
      const raw = readFileSync(this.getMcpConfigPath(), "utf-8");
      const config = JSON.parse(raw) as Record<string, unknown>;
      const servers = config.mcpServers as Record<string, unknown> | undefined;
      const contextMode = servers?.["context-mode"] as Record<string, unknown> | undefined;
      if (contextMode) {
        return {
          check: "MCP registration",
          status: "pass",
          message: "context-mode found in ~/.copilot/mcp-config.json",
        };
      }
      return {
        check: "MCP registration",
        status: "fail",
        message: "context-mode not found in ~/.copilot/mcp-config.json",
        fix: "copilot mcp add context-mode --type local -- context-mode",
      };
    } catch {
      return {
        check: "MCP registration",
        status: "warn",
        message: "Could not read ~/.copilot/mcp-config.json",
      };
    }
  }

  getInstalledVersion(): string {
    return existsSync(this.getSettingsPath()) ? "configured" : "unknown";
  }

  configureAllHooks(pluginRoot: string): string[] {
    const changes: string[] = [];
    const settings = this.readSettings() ?? {};
    const hooks = (settings.hooks as Record<string, unknown> | undefined) ?? {};
    const generated = this.generateHookConfig(pluginRoot);

    for (const [event, entries] of Object.entries(generated)) {
      const current = Array.isArray(hooks[event]) ? hooks[event] as unknown[] : [];
      const alreadyConfigured = current.some((entry) => JSON.stringify(entry).includes("context-mode") && JSON.stringify(entry).includes("copilot-cli"));
      if (!alreadyConfigured) {
        hooks[event] = [...current, ...entries];
        changes.push(`Configured ${event} hook`);
      }
    }

    settings.hooks = hooks;
    this.writeSettings(settings);
    changes.push(`Wrote hook config to ${this.getSettingsPath()}`);
    return changes;
  }

  setHookPermissions(pluginRoot: string): string[] {
    const set: string[] = [];
    for (const scriptName of ["pretooluse.mjs", "posttooluse.mjs", "sessionstart.mjs", "userpromptsubmitted.mjs", "sessionend.mjs"]) {
      const scriptPath = resolve(pluginRoot, "hooks", "copilot-cli", scriptName);
      try {
        accessSync(scriptPath, constants.R_OK);
        set.push(scriptPath);
      } catch {
        /* skip missing scripts */
      }
    }
    return set;
  }

  updatePluginRegistry(_pluginRoot: string, _version: string): void {
    // Copilot CLI MCP registration lives in ~/.copilot/mcp-config.json.
  }

  private extractSessionId(input: CopilotCLIHookInput): string {
    if (input.sessionId) return input.sessionId;
    if (input.session_id) return input.session_id;
    if (input.timestamp && input.cwd) return `copilot-${input.timestamp}`;
    return `pid-${process.ppid}`;
  }
}
