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

# Strip single trailing newline to match gen-skill-docs.js/sh byte-for-byte.
$preambleCore = (Get-Content -LiteralPath $preambleCorePath -Raw -Encoding UTF8) -replace "`r?`n$", ""
$preambleLegacy = (Get-Content -LiteralPath $preambleLegacyPath -Raw -Encoding UTF8) -replace "`r?`n$", ""

function Expand-Token {
    param(
        [string]$TemplateText,
        [string]$Token,
        [string]$Replacement
    )

    $pattern = [regex]::Escape($Token)
    return [regex]::Replace(
        $TemplateText,
        $pattern,
        [System.Text.RegularExpressions.MatchEvaluator] { param($m) $Replacement },
        1
    )
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
    $content = Get-Content -LiteralPath $tmpl -Raw -Encoding UTF8

    if ($content -match '\{\{PREAMBLE\}\}') {
        $rel = [System.IO.Path]::GetRelativePath($repoRoot, $tmpl).Replace('\', '/')
        Write-Warning "[deprecated] $rel uses {{PREAMBLE}}; migrate to {{PREAMBLE_CORE}} + {{PREAMBLE_REF_LINK}}"
    }

    $output = Expand-Token -TemplateText $content -Token '{{PREAMBLE_CORE}}' -Replacement $preambleCore
    $output = Expand-Token -TemplateText $output -Token '{{PREAMBLE_REF_LINK}}' -Replacement $preambleRefLinkLine
    $output = Expand-Token -TemplateText $output -Token '{{PREAMBLE}}' -Replacement $preambleLegacy

    $target = $tmpl -replace "\.tmpl$", ""
    Set-Content -LiteralPath $target -Value $output -Encoding UTF8 -NoNewline

    $relTarget = [System.IO.Path]::GetRelativePath($repoRoot, $target).Replace('\', '/')
    $relTemplate = [System.IO.Path]::GetRelativePath($repoRoot, $tmpl).Replace('\', '/')
    Write-Output "generated $relTarget (from $relTemplate)"
    $count++
}

Write-Output "processed $count template(s)"
