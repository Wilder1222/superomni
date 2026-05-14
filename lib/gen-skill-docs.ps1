param(
    [string]$TemplatePath
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$preambleCorePath = Join-Path $PSScriptRoot "preamble-core.md"
$preambleLegacyPath = Join-Path $PSScriptRoot "preamble.md"

# Fixed line emitted wherever {{PREAMBLE_REF_LINK}} appears. Keep byte-identical
# with gen-skill-docs.js and gen-skill-docs.sh for cross-platform parity.
$preambleRefLinkLine = '_See [preamble-ref.md](../../lib/preamble-ref.md) for detailed protocols._'

if (-not (Test-Path -LiteralPath $preambleCorePath)) {
    Write-Error "ERROR: preamble-core.md not found at $preambleCorePath"
    exit 1
}
if (-not (Test-Path -LiteralPath $preambleLegacyPath)) {
    Write-Error "ERROR: preamble.md not found at $preambleLegacyPath"
    exit 1
}

# Normalize line endings to LF, then strip a single trailing newline.
$preambleCore = (Get-Content -LiteralPath $preambleCorePath -Raw -Encoding UTF8) -replace "`r`n", "`n" -replace "`r", "`n" -replace "`n$", ""
$preambleLegacy = (Get-Content -LiteralPath $preambleLegacyPath -Raw -Encoding UTF8) -replace "`r`n", "`n" -replace "`r", "`n" -replace "`n$", ""

function Expand-Token {
    param(
        [string]$TemplateText,
        [string]$Token,
        [string]$Replacement
    )

    # Replace the FIRST occurrence only (parity with js/sh first-occurrence semantics).
    $idx = $TemplateText.IndexOf($Token)
    if ($idx -lt 0) {
        return $TemplateText
    }
    return $TemplateText.Substring(0, $idx) + $Replacement + $TemplateText.Substring($idx + $Token.Length)
}

$templates = @()
if ($TemplatePath) {
    $resolved = Resolve-Path -LiteralPath $TemplatePath -ErrorAction Stop
    $templates = @($resolved.Path)
}
else {
    $templates = Get-ChildItem -Path (Join-Path $repoRoot "skills") -Recurse -File -Filter "*.tmpl" |
        Select-Object -ExpandProperty FullName |
        Sort-Object
}

$count = 0
foreach ($tmpl in $templates) {
    # Normalize CRLF/CR → LF on read so all three generators emit identical bytes.
    $content = (Get-Content -LiteralPath $tmpl -Raw -Encoding UTF8) -replace "`r`n", "`n" -replace "`r", "`n"

    if ($content -match '\{\{PREAMBLE\}\}') {
        $rel = [System.IO.Path]::GetRelativePath($repoRoot, $tmpl).Replace('\', '/')
        Write-Warning "[deprecated] $rel uses {{PREAMBLE}}; migrate to {{PREAMBLE_CORE}} + {{PREAMBLE_REF_LINK}}"
    }

    # Note: ${CLAUDE_SKILL_DIR} is intentionally NOT substituted here. Anthropic's
    # skill runtime resolves it at load time; keeping the literal token avoids
    # per-OS path divergence between js / sh / ps1 generators.

    $output = Expand-Token -TemplateText $content -Token '{{PREAMBLE_CORE}}' -Replacement $preambleCore
    $output = Expand-Token -TemplateText $output -Token '{{PREAMBLE_REF_LINK}}' -Replacement $preambleRefLinkLine
    $output = Expand-Token -TemplateText $output -Token '{{PREAMBLE}}' -Replacement $preambleLegacy

    # Normalize: no trailing newline (parity with js / sh).
    $output = $output -replace "`n+$", ""

    # Write LF, UTF-8 without BOM, no implicit trailing newline.
    $target = $tmpl -replace "\.tmpl$", ""
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($target, $output, $utf8NoBom)

    $relTarget = [System.IO.Path]::GetRelativePath($repoRoot, $target).Replace('\', '/')
    $relTemplate = [System.IO.Path]::GetRelativePath($repoRoot, $tmpl).Replace('\', '/')
    Write-Output "generated $relTarget (from $relTemplate)"
    $count++
}

Write-Output "processed $count template(s)"
