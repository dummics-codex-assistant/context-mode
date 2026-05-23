param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$UpstreamRemote = "origin",
  [string]$ForkRemote = "fork",
  [string]$UpstreamRef = "origin/main",
  [string]$PatchRange = "v1.0.126..fork/dom/codex-italian-routing",
  [string]$WorktreeRoot = (Join-Path $RepoRoot ".work\worktrees"),
  [string]$BranchName,
  [string]$WorktreePath,
  [switch]$RunBuild,
  [switch]$RunTests
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & git -C $RepoRoot @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Args -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Invoke-WorktreeGit {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & git -C $WorktreePath @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Args -join ' ') failed with exit code $LASTEXITCODE"
  }
}

Invoke-Git fetch --prune --tags $UpstreamRemote
Invoke-Git fetch --prune $ForkRemote
Invoke-Git config rerere.enabled true
Invoke-Git config rerere.autoupdate true

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
if ([string]::IsNullOrWhiteSpace($BranchName)) {
  $BranchName = "dom/context-mode-upstream-sync-$stamp"
}
if ([string]::IsNullOrWhiteSpace($WorktreePath)) {
  $safeBranchName = $BranchName -replace "[^A-Za-z0-9._-]+", "-"
  $WorktreePath = Join-Path $WorktreeRoot $safeBranchName
}

if (Test-Path -LiteralPath $WorktreePath) {
  throw "Worktree path already exists: $WorktreePath"
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $WorktreePath) | Out-Null
Invoke-Git worktree add -b $BranchName $WorktreePath $UpstreamRef

$patchCommits = @(& git -C $RepoRoot rev-list --reverse --no-merges $PatchRange)
if ($LASTEXITCODE -ne 0 -or $patchCommits.Count -eq 0) {
  throw "No patch commits found for range: $PatchRange"
}

foreach ($commit in $patchCommits) {
  Write-Host "cherry-pick $commit"
  & git -C $WorktreePath cherry-pick -x $commit
  if ($LASTEXITCODE -ne 0) {
    $unmerged = @(& git -C $WorktreePath diff --name-only --diff-filter=U)
    if ($unmerged.Count -eq 0) {
      Write-Host "rerere resolved $commit; continuing"
      & git -C $WorktreePath cherry-pick --continue
      if ($LASTEXITCODE -eq 0) { continue }
    }

    Write-Host ""
    Write-Host "Cherry-pick stopped at $commit"
    Write-Host "Conflicts:"
    $unmerged
    Write-Host ""
    Write-Host "Resolve conflicts in $WorktreePath, then run:"
    Write-Host "  git -C `"$WorktreePath`" add <files>"
    Write-Host "  git -C `"$WorktreePath`" cherry-pick --continue"
    Write-Host ""
    Write-Host "After this first run, rerere will reuse recorded resolutions when the same conflicts recur."
    exit $LASTEXITCODE
  }
}

if ($RunBuild -or $RunTests) {
  if (-not (Test-Path -LiteralPath (Join-Path $WorktreePath "node_modules"))) {
    & npm install --prefix $WorktreePath
    if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }
  }
}

if ($RunBuild) {
  & npm run build --prefix $WorktreePath
  if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }
}

if ($RunTests) {
  & npm test --prefix $WorktreePath
  if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
}

Write-Host ""
Write-Host "Sync worktree ready:"
Write-Host "  Branch:   $BranchName"
Write-Host "  Worktree: $WorktreePath"
Write-Host "  Base:     $UpstreamRef"
Write-Host "  Patches:  $PatchRange"
