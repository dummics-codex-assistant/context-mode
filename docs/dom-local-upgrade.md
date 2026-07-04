# Dom Local Context-Mode Upgrade

This machine uses a custom local `context-mode` checkout instead of the plain npm package.

- Local repo: `C:\Users\domix\.codex\context-mode`
- Upstream remote: `origin` -> `https://github.com/mksglu/context-mode.git`
- Fork remote: `fork` -> `https://github.com/dummics-codex-assistant/context-mode.git`
- Global npm command: `context-mode` is linked to `C:\Users\domix\.codex\context-mode`
- Codex MCP config: `C:\Users\domix\.codex\config.toml` uses `command = "context-mode"`

Do not run the generic `ctx upgrade` flow for this install. It assumes a normal package upgrade and can overwrite or bypass local fork decisions. The safe path is a manual repo sync, rebuild, and normal Codex restart.

## Safety Model

Active Codex sessions should not be killed during the upgrade.

The MCP process already running inside an active Codex session keeps using the code it loaded at startup. Updating the linked checkout and rebuilding bundles affects the next `context-mode` process, so the new version is picked up when Codex restarts or opens a new session.

Do not delete or purge:

- `C:\Users\domix\.codex\context-mode\sessions`
- `C:\Users\domix\.codex\context-mode\content`
- any Codex session/transcript directories
- any context-mode SQLite or FTS files unless Dom explicitly asks for a purge

## Manual Upgrade

From PowerShell:

```powershell
$repo = "C:\Users\domix\.codex\context-mode"
git -C $repo fetch --all --prune --tags
git -C $repo status -sb
git -C $repo tag --sort=-v:refname | Select-Object -First 10
git -C $repo show origin/main:package.json | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).version))"
```

If the worktree is clean except known local scratch files, merge upstream into the custom branch:

```powershell
git -C $repo merge --no-edit -X theirs origin/main
```

`-X theirs` is intentional for this fork sync: upstream owns the moving product surface, while Dom-specific policy should be re-applied as small explicit commits after the merge. Do not blindly cherry-pick old generated bundle or test commits across large upstream gaps.

If conflicts remain, resolve them in source files first and leave generated bundles for `npm run build`.

## Rebuild And Verify

```powershell
npm install --prefix $repo
npm run build --prefix $repo
npm test --prefix $repo
npm list -g context-mode --depth=0
context-mode --version
context-mode doctor
```

For very large test output, redirect to a local log and inspect only failures. Do not dump raw logs into a Codex conversation.

The expected global npm state is a symlink like:

```text
context-mode@<version> -> .\..\..\..\.codex\context-mode
```

## After Upgrade

1. Commit the merge and any Dom-specific documentation or policy adjustments.
2. Push the fork branch if the upstream remote is clear and the branch is not behind.
3. Restart Codex when convenient. The next MCP startup should use the rebuilt local checkout.
4. Run `ctx doctor` or `context-mode doctor` in the new session to confirm the active MCP version.

If the current session's MCP tools time out during the upgrade, do not retry the same failing `ctx_*` call in a loop. Use bounded PowerShell checks against the local repo, finish the rebuild, then verify after Codex restarts.
