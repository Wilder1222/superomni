param(
    [string]$TemplatePath
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$preamblePath = Join-Path $PSScriptRoot "preamble.md"

if (-not (Test-Path -LiteralPath $preamblePath)) {
    Write-Error "ERROR: preamble.md not found at $preamblePath"
    exit 1
}

$preamble = Get-Content -LiteralPath $preamblePath -Raw -Encoding UTF8

function Expand-Preamble {
    param(
        [string]$TemplateText,
        [string]$PreambleText
    )

    $pattern = "\{\{PREAMBLE\}\}"
    return [regex]::Replace(
        $TemplateText,
        $pattern,
        [System.Text.RegularExpressions.MatchEvaluator] { param($m) $PreambleText },
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
    $output = Expand-Preamble -TemplateText $content -PreambleText $preamble
    $target = $tmpl -replace "\.tmpl$", ""
    Set-Content -LiteralPath $target -Value $output -Encoding UTF8 -NoNewline

    $relTarget = [System.IO.Path]::GetRelativePath($repoRoot, $target).Replace('\\', '/')
    $relTemplate = [System.IO.Path]::GetRelativePath($repoRoot, $tmpl).Replace('\\', '/')
    Write-Output "generated $relTarget (from $relTemplate)"
    $count++
}

Write-Output "processed $count template(s)"
